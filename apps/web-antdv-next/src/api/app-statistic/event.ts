import { requestClient } from '#/api/request';

import type { EventDto, GetEventsInput, PagedResultDto } from './types';

/**
 * 分页获取事件日志列表
 */
export async function getEventsApi(params: GetEventsInput) {
  return requestClient.get<PagedResultDto<EventDto>>(
    '/app-statistic/admin/events',
    { params },
  );
}
