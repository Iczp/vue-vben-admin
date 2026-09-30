import type { PagedResultDto } from '#/api/abp/types';
import type {
  ContentSourceCreateDto,
  ContentSourceDto,
  ContentSourceGetListInput,
  ContentSourceUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取采集数据源列表
 */
export async function getSourcesApi(params?: ContentSourceGetListInput) {
  return requestClient.get<PagedResultDto<ContentSourceDto>>(
    '/cms/admin/sources',
    { params },
  );
}

/**
 * 根据 ID 获取采集数据源详情
 */
export async function getSourceApi(id: string) {
  return requestClient.get<ContentSourceDto>(`/cms/admin/sources/${id}`);
}

/**
 * 创建采集数据源
 */
export async function createSourceApi(data: ContentSourceCreateDto) {
  return requestClient.post<ContentSourceDto>('/cms/admin/sources', data);
}

/**
 * 更新采集数据源
 */
export async function updateSourceApi(
  id: string,
  data: ContentSourceUpdateDto,
) {
  return requestClient.put<ContentSourceDto>(`/cms/admin/sources/${id}`, data);
}

/**
 * 删除采集数据源
 */
export async function deleteSourceApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/sources/${id}`);
}
