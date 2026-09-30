import type { PagedAndSortedResultRequestDto, PagedResultDto } from '#/api/abp/types';
import type {
  RecommendationRuleCreateDto,
  RecommendationRuleDto,
  RecommendationRuleUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取推荐规则列表
 */
export async function getRecommendationRulesApi(
  params?: PagedAndSortedResultRequestDto,
) {
  return requestClient.get<PagedResultDto<RecommendationRuleDto>>(
    '/cms/admin/recommendation-rules',
    { params },
  );
}

/**
 * 根据 ID 获取推荐规则详情
 */
export async function getRecommendationRuleApi(id: string) {
  return requestClient.get<RecommendationRuleDto>(
    `/cms/admin/recommendation-rules/${id}`,
  );
}

/**
 * 创建推荐规则
 */
export async function createRecommendationRuleApi(
  data: RecommendationRuleCreateDto,
) {
  return requestClient.post<RecommendationRuleDto>(
    '/cms/admin/recommendation-rules',
    data,
  );
}

/**
 * 更新推荐规则
 */
export async function updateRecommendationRuleApi(
  id: string,
  data: RecommendationRuleUpdateDto,
) {
  return requestClient.put<RecommendationRuleDto>(
    `/cms/admin/recommendation-rules/${id}`,
    data,
  );
}

/**
 * 删除推荐规则
 */
export async function deleteRecommendationRuleApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/recommendation-rules/${id}`);
}
