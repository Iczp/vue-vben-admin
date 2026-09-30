import type { PagedResultDto } from '#/api/abp/types';
import type {
  ContentPromotionCreateDto,
  ContentPromotionDto,
  ContentPromotionGetListInput,
  ContentPromotionUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取推广推荐列表
 */
export async function getPromotionsApi(params?: ContentPromotionGetListInput) {
  return requestClient.get<PagedResultDto<ContentPromotionDto>>(
    '/cms/admin/promotions',
    { params },
  );
}

/**
 * 根据 ID 获取推广推荐详情
 */
export async function getPromotionApi(id: string) {
  return requestClient.get<ContentPromotionDto>(`/cms/admin/promotions/${id}`);
}

/**
 * 创建推广推荐
 */
export async function createPromotionApi(data: ContentPromotionCreateDto) {
  return requestClient.post<ContentPromotionDto>(
    '/cms/admin/promotions',
    data,
  );
}

/**
 * 更新推广推荐
 */
export async function updatePromotionApi(
  id: string,
  data: ContentPromotionUpdateDto,
) {
  return requestClient.put<ContentPromotionDto>(
    `/cms/admin/promotions/${id}`,
    data,
  );
}

/**
 * 删除推广推荐
 */
export async function deletePromotionApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/promotions/${id}`);
}
