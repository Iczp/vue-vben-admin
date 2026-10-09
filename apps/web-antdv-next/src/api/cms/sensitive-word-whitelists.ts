import type { PagedResultDto } from '#/api/abp/types';
import type {
  CreateSensitiveWordWhitelistInput,
  GetSensitiveWordWhitelistsInput,
  SensitiveWordWhitelistDto,
  UpdateSensitiveWordWhitelistInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取敏感词白名单列表
 */
export async function getSensitiveWordWhitelistsApi(
  params?: GetSensitiveWordWhitelistsInput,
) {
  return requestClient.get<PagedResultDto<SensitiveWordWhitelistDto>>(
    '/cms/admin/sensitive-word-whitelists',
    { params },
  );
}

/**
 * 获取单个白名单详情
 */
export async function getSensitiveWordWhitelistApi(id: string) {
  return requestClient.get<SensitiveWordWhitelistDto>(
    `/cms/admin/sensitive-word-whitelists/${id}`,
  );
}

/**
 * 新建白名单词条
 */
export async function createSensitiveWordWhitelistApi(
  data: CreateSensitiveWordWhitelistInput,
) {
  return requestClient.post<SensitiveWordWhitelistDto>(
    '/cms/admin/sensitive-word-whitelists',
    data,
  );
}

/**
 * 更新白名单词条
 */
export async function updateSensitiveWordWhitelistApi(
  id: string,
  data: UpdateSensitiveWordWhitelistInput,
) {
  return requestClient.put<SensitiveWordWhitelistDto>(
    `/cms/admin/sensitive-word-whitelists/${id}`,
    data,
  );
}

/**
 * 删除白名单词条
 */
export async function deleteSensitiveWordWhitelistApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/sensitive-word-whitelists/${id}`);
}

/**
 * 启用白名单
 */
export async function enableSensitiveWordWhitelistApi(id: string) {
  return requestClient.post<void>(
    `/cms/admin/sensitive-word-whitelists/${id}/enable`,
  );
}

/**
 * 禁用白名单
 */
export async function disableSensitiveWordWhitelistApi(id: string) {
  return requestClient.post<void>(
    `/cms/admin/sensitive-word-whitelists/${id}/disable`,
  );
}
