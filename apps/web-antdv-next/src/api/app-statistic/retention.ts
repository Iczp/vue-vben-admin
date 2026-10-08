import { requestClient } from '#/api/request';

import type { AppStatisticQueryInput, RetentionDto } from './types';

/**
 * 获取留存分析数据
 */
export async function getRetentionApi(params: AppStatisticQueryInput) {
  return requestClient.get<RetentionDto[]>('/app-statistic/admin/retention-analysis', {
    params,
  });
}
