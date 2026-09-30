import { requestClient } from '#/api/request';

import type { AppStatisticQueryInput, PageAnalysisDto } from './types';

/**
 * 获取页面分析统计
 */
export async function getPageAnalysisApi(params: AppStatisticQueryInput) {
  return requestClient.get<PageAnalysisDto>(
    '/app-statistic/admin/page-analysis',
    { params },
  );
}
