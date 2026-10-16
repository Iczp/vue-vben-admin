import type { RetentionDto } from './types';

import { requestClient } from '#/api/request';

/**
 * 获取留存分析数据
 */
export async function getRetentionApi(params: {
  appId?: string;
  endDate: string;
  startDate: string;
}) {
  return requestClient.get<RetentionDto[]>('/app-statistic/admin/retention', {
    params,
  });
}
