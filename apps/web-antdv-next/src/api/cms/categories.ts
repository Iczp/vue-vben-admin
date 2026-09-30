import type { PagedResultDto } from '#/api/abp/types';
import type {
  CategoryCreateDto,
  CategoryDto,
  CategoryGetListInput,
  CategoryUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取分类列表
 */
export async function getCategoriesApi(params?: CategoryGetListInput) {
  return requestClient.get<PagedResultDto<CategoryDto>>(
    '/cms/admin/categories',
    { params },
  );
}

/**
 * 根据 ID 获取分类详情
 */
export async function getCategoryApi(id: string) {
  return requestClient.get<CategoryDto>(`/cms/admin/categories/${id}`);
}

/**
 * 创建新分类
 */
export async function createCategoryApi(data: CategoryCreateDto) {
  return requestClient.post<CategoryDto>('/cms/admin/categories', data);
}

/**
 * 更新分类
 */
export async function updateCategoryApi(id: string, data: CategoryUpdateDto) {
  return requestClient.put<CategoryDto>(`/cms/admin/categories/${id}`, data);
}

/**
 * 删除分类
 */
export async function deleteCategoryApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/categories/${id}`);
}
