import type { PagedResultDto } from '#/api/abp/types';
import type {
  GetScopesInput,
  ScopeCreateInput,
  ScopeDto,
  ScopeUpdateInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取 Scope 列表
 */
export async function getScopesApi(params?: GetScopesInput) {
  return requestClient.get<PagedResultDto<ScopeDto>>('/api/openiddict/scope', {
    params,
  });
}

/**
 * 获取 Scope 详情
 */
export async function getScopeApi(id: string) {
  return requestClient.get<ScopeDto>(`/api/openiddict/scope/${id}`);
}

/**
 * 创建 Scope
 */
export async function createScopeApi(data: ScopeCreateInput) {
  return requestClient.post<ScopeDto>('/api/openiddict/scope', data);
}

/**
 * 更新 Scope
 */
export async function updateScopeApi(id: string, data: ScopeUpdateInput) {
  return requestClient.put<ScopeDto>(`/api/openiddict/scope/${id}`, data);
}

/**
 * 删除 Scope
 */
export async function deleteScopeApi(id: string) {
  return requestClient.delete<void>(`/api/openiddict/scope/${id}`);
}
