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
  brand?: string;
  browser?: string;
  browserInfo?: string;
  chatObjectIdList?: number[];
  clientId?: string;
  clientName?: string;
  connectionId: string;
  creationTime?: string;
  deviceId?: string;
  deviceInfo?: string;
  deviceType?: string;
  host?: string;
  ipAddress?: string;
  model?: string;
  platform?: string;
  pushClientId?: string;
  queryId?: string;
  userId?: string;
  userName?: string;
}

/**
 * 在线 Host 节点 DTO (OnlineHostDto)
 */
export interface OnlineHostDto {
  count: number;
  host: string;
  startTime?: string;
}

/**
 * 最近在线记录 (LastOnline)
 */
export interface LastOnlineDto {
  activeTime?: string;
  deviceId?: string;
  deviceType?: string;
  ownerId?: number;
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
  chatObjectId?: number;
  clientId?: string;
  connectionId?: string;
  endActiveTime?: string;
  endCreationTime?: string;
  host?: string;
  keyword?: string;
  platform?: string;
  startActiveTime?: string;
  startCreationTime?: string;
  userId?: string;
}

export interface GetOnlineHostsInput extends PagedAndSortedResultRequestDto {
  host?: string;
}

/**
 * 分页获取所有在线连接 (GET /api/chat/online)
 */
export async function getOnlineConnectionsApi(
  params?: GetOnlineConnectionsInput,
) {
  return requestClient.get<PagedResultDto<ConnectionPoolDto>>('/chat/online', {
    params,
  });
}

/**
 * 获取在线连接详情 (GET /api/chat/online/{id})
 */
export async function getOnlineConnectionApi(id: string) {
  return requestClient.get<ConnectionPoolDto>(`/chat/online/${id}`);
}

/**
 * 获取当前总在线连接数 (GET /api/chat/online/total-count)
 */
export async function getOnlineTotalCountApi(host?: string) {
  return requestClient.get<number>('/chat/online/total-count', {
    params: { host },
  });
}

/**
 * 分页获取所有主机节点及连接分布 (GET /api/chat/online/hosts)
 */
export async function getOnlineHostsApi(params?: GetOnlineHostsInput) {
  return requestClient.get<PagedResultDto<OnlineHostDto>>('/chat/online/hosts', {
    params,
  });
}

/**
 * 获取指定用户的所有在线连接 (GET /api/chat/online/by-user/{userId})
 */
export async function getOnlineConnectionsByUserApi(
  userId: string,
  params?: PagedAndSortedResultRequestDto,
) {
  return requestClient.get<PagedResultDto<ConnectionPoolDto>>(
    `/chat/online/by-user/${userId}`,
    { params },
  );
}

/**
 * 获取指定聊天对象的所有在线连接 (GET /api/chat/online/by-owner/{ownerId})
 */
export async function getOnlineConnectionsByOwnerApi(
  ownerId: number | string,
  params?: PagedAndSortedResultRequestDto,
) {
  return requestClient.get<PagedResultDto<ConnectionPoolDto>>(
    `/chat/online/by-owner/${ownerId}`,
    { params },
  );
}

/**
 * 获取指定用户的连接数量 (GET /api/chat/online/count-by-user/{userId})
 */
export async function getOnlineCountByUserApi(userId: string) {
  return requestClient.get<number>(`/chat/online/count-by-user/${userId}`);
}

/**
 * 获取指定聊天对象的连接数量 (GET /api/chat/online/count-by-owner/{ownerId})
 */
export async function getOnlineCountByOwnerApi(ownerId: number | string) {
  return requestClient.get<number>(`/chat/online/count-by-owner/${ownerId}`);
}

/**
 * 获取指定会话的在线连接数量 (GET /api/chat/online/count-by-session/{sessionId})
 */
export async function getOnlineCountBySessionApi(sessionId: string) {
  return requestClient.get<number>(`/chat/online/count-by-session/${sessionId}`);
}

/**
 * 获取聊天对象的最近在线记录 (GET /api/chat/online/last-online/{ownerId})
 */
export async function getLastOnlineApi(
  ownerId: number | string,
  params?: PagedAndSortedResultRequestDto,
) {
  return requestClient.get<PagedResultDto<LastOnlineDto>>(
    `/chat/online/last-online/${ownerId}`,
    { params },
  );
}

/**
 * 获取聊天对象的在线好友数量 (GET /api/chat/online/online-friends-count/{ownerId})
 */
export async function getOnlineFriendsCountApi(ownerId: number | string) {
  return requestClient.get<number>(
    `/chat/online/online-friends-count/${ownerId}`,
  );
}

/**
 * 强制断开连接 (POST /api/chat/online/abort)
 */
export async function abortOnlineConnectionsApi(data: AbortInput) {
  return requestClient.post('/chat/online/abort', data);
}

/**
 * 移除单个连接 (DELETE /api/chat/online)
 */
export async function deleteOnlineConnectionApi(connectionId: string) {
  return requestClient.delete('/chat/online', {
    params: { connectionId },
  });
}

/**
 * 清空所有/指定主机连接 (POST /api/chat/online/clear-all)
 */
export async function clearAllOnlineConnectionsApi(
  hosts?: string[],
  reason = '管理员清空连接',
) {
  return requestClient.post<Record<string, number>>(
    '/chat/online/clear-all',
    hosts && hosts.length > 0 ? hosts : null,
    {
      params: { reason },
    },
  );
}
