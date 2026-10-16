import type { AppStatisticQueryInput, RetentionDto } from './types';

import { requestClient } from '#/api/request';

/**
 * 获取留存分析数据
 */
export async function getRetentionApi(params: AppStatisticQueryInput) {
  return requestClient.get<RetentionDto[]>(
    '/app-statistic/admin/retention-analysis',
    {
      params,
    },
  );
}
