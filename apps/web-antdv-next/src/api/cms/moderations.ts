import type { PagedResultDto } from '#/api/abp/types';
import type {
  AdminModerationListInput,
  ContentModerationDto,
  ReviewDecisionInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取风控机审列表
 */
export async function getModerationsApi(params?: AdminModerationListInput) {
  return requestClient.get<PagedResultDto<ContentModerationDto>>(
    '/cms/admin/moderations',
    { params },
  );
}

/**
 * 根据 ID 获取风控机审详情 (含匹配项与违规规则)
 */
export async function getModerationApi(id: string) {
  return requestClient.get<ContentModerationDto>(`/cms/admin/moderations/${id}`);
}

/**
 * 人工复审终审决策
 */
export async function reviewModerationApi(
  id: string,
  data: ReviewDecisionInput,
) {
  return requestClient.post<void>(`/cms/admin/moderations/${id}/review`, data);
}
