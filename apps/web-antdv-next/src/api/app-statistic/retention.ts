import { requestClient } from '#/api/request';

import type { RetentionDto } from './types';

/**
 * 获取留存分析数据
 */
export async function getRetentionApi(params: {
  appId?: string;
  startDate: string;
  endDate: string;
}) {
  return requestClient.get<RetentionDto[]>('/app-statistic/admin/retention', {
    params,
  });
}
