import type { ActivityAnalysisDto, AppStatisticQueryInput } from './types';

import { requestClient } from '#/api/request';

/**
 * 获取活跃分析数据
 */
export async function getActivityAnalysisApi(params: AppStatisticQueryInput) {
  return requestClient.get<ActivityAnalysisDto>(
    '/app-statistic/admin/activity',
    { params },
  );
}
