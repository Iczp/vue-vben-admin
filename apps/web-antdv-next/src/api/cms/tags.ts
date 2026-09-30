import type { PagedResultDto } from '#/api/abp/types';
import type {
  TagCreateDto,
  TagDto,
  TagGetListInput,
  TagUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取标签列表
 */
export async function getTagsApi(params?: TagGetListInput) {
  return requestClient.get<PagedResultDto<TagDto>>('/cms/admin/tags', {
    params,
  });
}

/**
 * 根据 ID 获取标签详情
 */
export async function getTagApi(id: string) {
  return requestClient.get<TagDto>(`/cms/admin/tags/${id}`);
}

/**
 * 创建新标签
 */
export async function createTagApi(data: TagCreateDto) {
  return requestClient.post<TagDto>('/cms/admin/tags', data);
}

/**
 * 更新标签
 */
export async function updateTagApi(id: string, data: TagUpdateDto) {
  return requestClient.put<TagDto>(`/cms/admin/tags/${id}`, data);
}

/**
 * 删除标签
 */
export async function deleteTagApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/tags/${id}`);
}
