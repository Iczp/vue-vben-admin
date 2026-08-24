import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface EntityPropertyChangeDto {
  id: string;
  newValue?: string;
  originalValue?: string;
  propertyName?: string;
  propertyTypeFullName?: string;
}

export interface EntityChangeDto {
  changeTime?: string;
  changeType?: number;
  entityId?: string;
  entityTypeFullName?: string;
  extraProperties?: Record<string, any>;
  id: string;
  propertyChanges?: EntityPropertyChangeDto[];
  tenantId?: string;
}

export interface AuditLogActionDto {
  executionDuration?: number;
  executionTime?: string;
  extraProperties?: Record<string, any>;
  id: string;
  methodName?: string;
  parameters?: string;
  serviceName?: string;
}

export interface AuditLogDto {
  actions?: AuditLogActionDto[];
  applicationName?: string;
  browserInfo?: string;
  clientId?: string;
  clientIpAddress?: string;
  clientName?: string;
  comments?: string;
  correlationId?: string;
  entityChanges?: EntityChangeDto[];
  exceptions?: string;
  executionDuration?: number;
  executionTime?: string;
  extraProperties?: Record<string, any>;
  httpMethod?: string;
  httpStatusCode?: number;
  id: string;
  impersonatorTenantId?: string;
  impersonatorUserId?: string;
  tenantId?: string;
  tenantName?: string;
  url?: string;
  userId?: string;
  userName?: string;
}

export interface GetAuditLogInput extends PagedAndSortedResultRequestDto {
  applicationName?: string;
  clientId?: string;
  correlationId?: string;
  endTime?: string;
  hasException?: boolean;
  httpMethod?: string;
  httpStatusCode?: number;
  maxExecutionDuration?: number;
  minExecutionDuration?: number;
  startTime?: string;
  url?: string;
  userName?: string;
}

/**
 * 分页获取审计日志列表
 */
export async function getAuditLogsApi(params?: GetAuditLogInput) {
  return requestClient.get<PagedResultDto<AuditLogDto>>(
    '/logmanagement/audit-log',
    { params },
  );
}

/**
 * 获取审计日志详情
 */
export async function getAuditLogApi(id: string) {
  return requestClient.get<AuditLogDto>(`/logmanagement/audit-log/${id}`);
}

/**
 * 分页获取实体变更列表
 */
export async function getEntityChangesApi(
  params?: PagedAndSortedResultRequestDto & {
    auditLogId?: string;
    entityId?: string;
    entityTypeFullName?: string;
  },
) {
  return requestClient.get<PagedResultDto<EntityChangeDto>>(
    '/logmanagement/entity-change',
    { params },
  );
}

/**
 * 获取实体变更详情
 */
export async function getEntityChangeApi(id: string) {
  return requestClient.get<EntityChangeDto>(
    `/logmanagement/entity-change/${id}`,
  );
}
