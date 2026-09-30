import { requestClient } from '#/api/request';

import type { AppStatisticQueryInput, ChannelAnalysisDto } from './types';

/**
 * 获取渠道分析统计
 */
export async function getChannelAnalysisApi(params: AppStatisticQueryInput) {
  return requestClient.get<ChannelAnalysisDto>(
    '/app-statistic/admin/channel-analysis',
    { params },
  );
}
