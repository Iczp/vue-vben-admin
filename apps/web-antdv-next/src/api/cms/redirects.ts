import type { PagedResultDto } from '#/api/abp/types';
import type {
  ContentRedirectCreateDto,
  ContentRedirectDto,
  ContentRedirectGetListInput,
  ContentRedirectUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取重定向规则列表
 */
export async function getRedirectsApi(params?: ContentRedirectGetListInput) {
  return requestClient.get<PagedResultDto<ContentRedirectDto>>(
    '/cms/admin/redirects',
    { params },
  );
}

/**
 * 根据 ID 获取重定向规则详情
 */
export async function getRedirectApi(id: string) {
  return requestClient.get<ContentRedirectDto>(`/cms/admin/redirects/${id}`);
}

/**
 * 创建重定向规则
 */
export async function createRedirectApi(data: ContentRedirectCreateDto) {
  return requestClient.post<ContentRedirectDto>('/cms/admin/redirects', data);
}

/**
 * 更新重定向规则
 */
export async function updateRedirectApi(
  id: string,
  data: ContentRedirectUpdateDto,
) {
  return requestClient.put<ContentRedirectDto>(
    `/cms/admin/redirects/${id}`,
    data,
  );
}

/**
 * 删除重定向规则
 */
export async function deleteRedirectApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/redirects/${id}`);
}
