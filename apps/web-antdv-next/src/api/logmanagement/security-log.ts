import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface SecurityLogDto {
  action?: string;
  applicationName?: string;
  browserInfo?: string;
  clientId?: string;
  correlationId?: string;
  creationTime?: string;
  extraProperties?: Record<string, any>;
  id: string;
  identity?: string;
  tenantId?: string;
  tenantName?: string;
  userId?: string;
  userName?: string;
}

export interface GetSecurityLogInput extends PagedAndSortedResultRequestDto {
  action?: string;
  applicationName?: string;
  clientId?: string;
  correlationId?: string;
  endTime?: string;
  identity?: string;
  startTime?: string;
  userName?: string;
}

/**
 * 分页获取当前用户/系统安全日志
 */
export async function getCurrentUserSecurityLogsApi(
  params?: GetSecurityLogInput,
) {
  return requestClient.get<PagedResultDto<SecurityLogDto>>(
    '/api/logmanagement/current-user-security-log',
    { params },
  );
}
