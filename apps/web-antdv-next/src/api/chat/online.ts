import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 在线连接 DTO (ConnectionPoolDto)
 */
export interface ConnectionPoolDto {
  activeTime?: string;
  appId?: string;
  appName?: string;
  browser?: string;
  chatObjectIdList?: string[];
  clientId?: string;
  connectionId: string;
  creationTime?: string;
  deviceId?: string;
  deviceType?: string;
  host?: string;
  ipAddress?: string;
  platform?: string;
  remoteIpAddress?: string;
  userId?: string;
  userName?: string;
}

/**
 * 在线 Host 节点 DTO (OnlineHostDto)
 */
export interface OnlineHostDto {
  activeTime?: string;
  connectionCount: number;
  creationTime?: string;
  description?: string;
  host: string;
  ipAddress?: string;
  isEnabled?: boolean;
}

/**
 * 强制断开连接入参 (AbortInput)
 */
export interface AbortInput {
  connectionIdList: string[];
  reason: string;
}

export interface GetOnlineConnectionsInput
  extends PagedAndSortedResultRequestDto {
  appId?: string;
  clientId?: string;
  deviceId?: string;
  deviceType?: string;
  host?: string;
  ipAddress?: string;
  keyword?: string;
  platform?: string;
  userId?: string;
}

/**
 * 分页获取所有在线连接
 */
export async function getOnlineConnectionsApi(
  params?: GetOnlineConnectionsInput,
) {
  return requestClient.get<PagedResultDto<ConnectionPoolDto>>('/chat/online', {
    params,
  });
}

/**
 * 获取在线连接详情
 */
export async function getOnlineConnectionApi(id: string) {
  return requestClient.get<ConnectionPoolDto>(`/chat/online/${id}`);
}

/**
 * 获取当前总在线连接数
 */
export async function getOnlineTotalCountApi() {
  return requestClient.get<number>('/chat/online/total-count');
}

/**
 * 分页获取所有主机节点及连接分布
 */
export async function getOnlineHostsApi(
  params?: PagedAndSortedResultRequestDto,
) {
  return requestClient.get<PagedResultDto<OnlineHostDto>>('/chat/online/hosts', {
    params,
  });
}

/**
 * 强制断开指定连接
 */
export async function abortOnlineConnectionsApi(data: AbortInput) {
  return requestClient.post('/chat/online/abort', data);
}

/**
 * 清空所有连接 (高危操作)
 */
export async function clearAllOnlineConnectionsApi(reason: string) {
  return requestClient.post('/chat/online/clear-all', null, {
    params: { reason },
  });
}

/**
 * 获取指定聊天对象的连接数
 */
export async function getOnlineCountByOwnerApi(ownerId: number | string) {
  return requestClient.get<number>(`/chat/online/count-by-owner/${ownerId}`);
}

/**
 * 获取指定用户的连接数
 */
export async function getOnlineCountByUserApi(userId: string) {
  return requestClient.get<number>(`/chat/online/count-by-user/${userId}`);
}
