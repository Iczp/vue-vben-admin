import type { PagedResultDto } from '#/api/abp/types';
import type {
  ContentDailyStatDto,
  ContentDailyStatGetListInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取每日内容统计
 */
export async function getDailyStatsApi(params?: ContentDailyStatGetListInput) {
  return requestClient.get<PagedResultDto<ContentDailyStatDto>>(
    '/cms/admin/daily-stats',
    { params },
  );
}
