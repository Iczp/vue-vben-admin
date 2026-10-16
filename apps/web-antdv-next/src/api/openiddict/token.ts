import type { GetTokensInput, TokenDto } from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 分页获取 OpenIddict 令牌列表
 */
export async function getTokensApi(params?: GetTokensInput) {
  return requestClient.get<PagedResultDto<TokenDto>>('/openiddict/token', {
    params,
  });
}

/**
 * 获取令牌详情
 */
export async function getTokenApi(id: string) {
  return requestClient.get<TokenDto>(`/openiddict/token/${id}`);
}

/**
 * 删除令牌记录
 */
export async function deleteTokenApi(id: string) {
  return requestClient.delete<void>(`/openiddict/token/${id}`);
}

/**
 * 主动吊销令牌
 */
export async function revokeTokenApi(id: string) {
  return requestClient.post<void>(`/openiddict/token/${id}/revoke`);
}

/**
 * 按用户主体吊销全部令牌（强制下线）
 */
export async function revokeTokensBySubjectApi(subject: string) {
  return requestClient.post<void>('/openiddict/token/revoke-by-subject', null, {
    params: { subject },
  });
}

/**
 * 批量吊销令牌
 */
export async function revokeManyTokensApi(ids: string[]) {
  return requestClient.post<void>('/openiddict/token/revoke-many', ids);
}
