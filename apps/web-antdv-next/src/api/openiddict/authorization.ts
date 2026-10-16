import type { AuthorizationDto, GetAuthorizationsInput } from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 分页获取 OpenIddict 授权记录列表
 */
export async function getAuthorizationsApi(params?: GetAuthorizationsInput) {
  return requestClient.get<PagedResultDto<AuthorizationDto>>(
    '/openiddict/authorization',
    { params },
  );
}

/**
 * 获取授权详情
 */
export async function getAuthorizationApi(id: string) {
  return requestClient.get<AuthorizationDto>(`/openiddict/authorization/${id}`);
}

/**
 * 删除授权记录
 */
export async function deleteAuthorizationApi(id: string) {
  return requestClient.delete<void>(`/openiddict/authorization/${id}`);
}

/**
 * 主动吊销授权（同时作废关联的所有令牌）
 */
export async function revokeAuthorizationApi(id: string) {
  return requestClient.post<void>(`/openiddict/authorization/${id}/revoke`);
}

/**
 * 批量吊销授权记录
 */
export async function revokeManyAuthorizationsApi(ids: string[]) {
  return requestClient.post<void>(
    '/openiddict/authorization/revoke-many',
    ids,
  );
}

