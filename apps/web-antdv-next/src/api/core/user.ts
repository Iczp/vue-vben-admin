import type { UserInfo } from '@vben/types';

import { preferences } from '@vben/preferences';

import { authRequestClient } from '#/api/request';

/**
 * 获取用户信息（对齐 OpenIddict /connect/userinfo）
 */
export async function getUserInfoApi(): Promise<UserInfo> {
  const userInfoPath =
    (import.meta.env.VITE_AUTH_USER_INFO_PATH as string) || '/connect/userinfo';

  const data = await authRequestClient.get<Record<string, any>>(userInfoPath);

  const roles = Array.isArray(data?.role)
    ? data.role
    : typeof data?.role === 'string'
      ? [data.role]
      : Array.isArray(data?.roles)
        ? data.roles
        : [];

  return {
    avatar: data?.picture || '',
    desc: data?.description || '',
    homePath: preferences.app.defaultHomePath || '/dashboard',
    realName:
      data?.name || data?.given_name || data?.preferred_username || 'User',
    roles,
    token: '',
    userId: data?.sub || data?.id || '',
    username: data?.preferred_username || data?.name || data?.sub || '',
  };
}
