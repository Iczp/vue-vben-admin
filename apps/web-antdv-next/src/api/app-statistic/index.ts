import { requestClient } from '#/api/request';

import type { RebuildDailyDataInput } from './types';

export * from './activity';
export * from './channel';
export * from './dashboard';
export * from './device';
export * from './event';
export * from './page';
export * from './retention';
export * from './types';
export * from './version';

/**
 * 手动重算某天统计数据
 */
export async function rebuildDailyDataApi(data: RebuildDailyDataInput) {
  return requestClient.post('/app-statistic/admin/rebuild', data);
}

/**
 * 清理超时会话
 */
export async function cleanupSessionsApi(
  appId: string,
  timeoutMinutes: number = 30,
) {
  return requestClient.post<number>(
    '/app-statistic/admin/cleanup-sessions',
    null,
    {
      params: { appId, timeoutMinutes },
    },
  );
}
