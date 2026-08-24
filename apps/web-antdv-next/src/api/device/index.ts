import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface DeviceDto {
  appVersion?: string;
  brand?: string;
  creationTime?: string;
  deviceId: string;
  deviceGroupIdList?: string[];
  id: string;
  imei?: string;
  isEnabled: boolean;
  isOnline?: boolean;
  lastActiveTime?: string;
  model?: string;
  name?: string;
  platform?: string;
  systemVersion?: string;
  userId?: string;
  userName?: string;
}

export interface DeviceCreateInput {
  appVersion?: string;
  brand?: string;
  deviceId: string;
  deviceGroupIdList?: string[];
  imei?: string;
  isEnabled?: boolean;
  model?: string;
  name?: string;
  platform?: string;
  systemVersion?: string;
}

export interface DeviceUpdateInput extends Partial<DeviceCreateInput> {}

export interface GetDeviceInput extends PagedAndSortedResultRequestDto {
  brand?: string;
  deviceId?: string;
  isEnabled?: boolean;
  isOnline?: boolean;
  keyword?: string;
  platform?: string;
  userId?: string;
}

export interface DeviceGroupDto {
  description?: string;
  id: string;
  name: string;
}

/**
 * 分页获取设备列表
 */
export async function getDevicesApi(params?: GetDeviceInput) {
  return requestClient.get<PagedResultDto<DeviceDto>>('/chat/device', {
    params,
  });
}

/**
 * 获取设备详情
 */
export async function getDeviceApi(id: string) {
  return requestClient.get<DeviceDto>(`/chat/device/${id}`);
}

/**
 * 更新设备信息
 */
export async function updateDeviceApi(id: string, data: DeviceUpdateInput) {
  return requestClient.post<DeviceDto>(`/chat/device/${id}/update`, data);
}

/**
 * 踢下线/删除设备
 */
export async function deleteDeviceApi(id: string) {
  return requestClient.post<void>(`/chat/device/${id}/delete`);
}

/**
 * 获取设备分组列表
 */
export async function getDeviceGroupsApi() {
  return requestClient.get<DeviceGroupDto[]>('/chat/device-group/many');
}
