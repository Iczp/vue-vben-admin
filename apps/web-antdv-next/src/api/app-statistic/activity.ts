import { requestClient } from '#/api/request';

import type { ActivityAnalysisDto, AppStatisticQueryInput } from './types';

/**
 * 获取活跃分析数据
 */
export async function getActivityAnalysisApi(params: AppStatisticQueryInput) {
  return requestClient.get<ActivityAnalysisDto>(
    '/app-statistic/admin/activity',
    { params },
  );
}
