import type { PagedResultDto } from '#/api/abp/types';
import type { GetTokensInput, TokenDto } from './types';

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
 * 撤销/删除令牌
 */
export async function deleteTokenApi(id: string) {
  return requestClient.delete<void>(`/openiddict/token/${id}`);
}
