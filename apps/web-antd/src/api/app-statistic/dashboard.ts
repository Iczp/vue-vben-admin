import { requestClient } from '#/api/request';

import type {
  AppStatisticDashboardDto,
  AppStatisticQueryInput,
  OverviewDto,
} from './types';

/**
 * 获取仪表盘数据
 */
export async function getDashboardApi(params: AppStatisticQueryInput) {
  return requestClient.get<AppStatisticDashboardDto>(
    '/app-statistic/admin/dashboard',
    { params },
  );
}

/**
 * 获取概览数据
 */
export async function getOverviewApi(appId: string, date?: string) {
  return requestClient.get<OverviewDto>('/app-statistic/admin/overview', {
    params: { appId, date },
  });
}
