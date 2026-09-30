import { requestClient } from '#/api/request';

import type { AppStatisticQueryInput, VersionAnalysisDto } from './types';

/**
 * 获取版本分析统计
 */
export async function getVersionAnalysisApi(params: AppStatisticQueryInput) {
  return requestClient.get<VersionAnalysisDto>(
    '/app-statistic/admin/version-analysis',
    { params },
  );
}
