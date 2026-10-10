import type { UserDataDto } from '#/api/identity/user-lookup';
import { getUserLookupByIdApi } from '#/api/identity/user-lookup';

// 内存用户缓存
const userCache = new Map<string, UserDataDto | null>();
const pendingPromises = new Map<string, Promise<UserDataDto | null>>();

/**
 * 根据 UserId 获取用户信息（带内存缓存与去重）
 */
export async function lookupUser(userId?: string): Promise<UserDataDto | null> {
  if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
    return null;
  }

  const normalizedId = userId.toLowerCase();

  if (userCache.has(normalizedId)) {
    return userCache.get(normalizedId) ?? null;
  }

  if (pendingPromises.has(normalizedId)) {
    return pendingPromises.get(normalizedId)!;
  }

  const promise = getUserLookupByIdApi(normalizedId)
    .then((res) => {
      userCache.set(normalizedId, res);
      return res;
    })
    .catch(() => {
      userCache.set(normalizedId, null);
      return null;
    })
    .finally(() => {
      pendingPromises.delete(normalizedId);
    });

  pendingPromises.set(normalizedId, promise);
  return promise;
}

/**
 * 格式化用户展示名称
 */
export function formatUserDisplayName(user: UserDataDto | null, fallbackId?: string): string {
  if (user) {
    const fullName = [user.name, user.surname].filter(Boolean).join(' ').trim();
    if (fullName && user.userName && fullName !== user.userName) {
      return `${fullName} (${user.userName})`;
    }
    if (fullName) return fullName;
    if (user.userName) return user.userName;
  }

  if (fallbackId && fallbackId !== '00000000-0000-0000-0000-000000000000') {
    return fallbackId.length > 8 ? `${fallbackId.slice(0, 8)}...` : fallbackId;
  }

  return '未登录 / 游客';
}
