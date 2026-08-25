import type { PagedResultDto } from '#/api/abp/types';
import type { AuthorizationDto, GetAuthorizationsInput } from './types';

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
 * 撤销/删除授权
 */
export async function deleteAuthorizationApi(id: string) {
  return requestClient.delete<void>(`/openiddict/authorization/${id}`);
}
