import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

// ==================== Device 类型与 DTO ====================

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

export interface DeviceDetailDto extends DeviceDto {
  app?: string;
  appLanguage?: string;
  appName?: string;
  appPlatform?: string;
  appVersion?: string;
  appVersionCode?: number;
  appWgtVersion?: string;
  bluetoothEnabled?: boolean;
  browserName?: string;
  browserVersion?: string;
  cacheLocation?: string;
  deviceOrientation?: string;
  devicePixelRatio?: number;
  fontSizeSetting?: number;
  host?: string;
  hostFontSizeSetting?: string;
  hostLanguage?: string;
  hostName?: string;
  hostPackageName?: string;
  hostSdkVersion?: string;
  hostTheme?: string;
  hostVersion?: string;
  language?: string;
  locationEnabled?: boolean;
  navigationBarHeight?: number;
  osLanguage?: string;
  osName?: string;
  osTheme?: string;
  osVersion?: string;
  pixelRatio?: number;
  remarks?: string;
  romName?: string;
  romVersion?: string;
  safeArea?: string;
  safeAreaInsets?: string;
  screenHeight?: number;
  screenWidth?: number;
  sdkVersion?: string;
  statusBarHeight?: number;
  storage?: string;
  swanNativeVersion?: string;
  theme?: string;
  titleBarHeight?: number;
  ua?: string;
  uniCompileVersion?: string;
  uniPlatform?: string;
  uniRuntimeVersion?: string;
  version?: string;
  wifiEnabled?: boolean;
  windowBottom?: number;
  windowHeight?: number;
  windowTop?: number;
  windowWidth?: number;
}

export interface DeviceCreateInput {
  appId?: string;
  appVersion?: string;
  brand?: string;
  deviceId: string;
  deviceGroupIdList?: string[];
  imei?: string;
  isEnabled?: boolean;
  model?: string;
  name?: string;
  platform?: string;
  remarks?: string;
  systemVersion?: string;
}

export interface DeviceUpdateInput {
  isEnabled?: boolean;
  name?: string;
  remarks?: string;
}

export interface GetDeviceInput extends PagedAndSortedResultRequestDto {
  appId?: string;
  brand?: string;
  deviceGroupId?: string;
  deviceId?: string;
  isEnabled?: boolean;
  keyword?: string;
  platform?: string;
  userId?: string;
}

// ==================== DeviceGroup 类型与 DTO ====================

export interface DeviceGroupDto {
  creationTime?: string;
  creatorId?: string;
  description?: string;
  deviceCount?: number;
  id: string;
  name: string;
}

export interface DeviceGroupCreateInput {
  description?: string;
  name: string;
}

export interface DeviceGroupUpdateInput {
  description?: string;
  name: string;
}

export interface GetDeviceGroupInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
}

// ==================== Device API ====================

/**
 * 分页获取设备列表
 */
export async function getDevicesApi(params?: GetDeviceInput) {
  return requestClient.get<PagedResultDto<DeviceDto>>('/chat/device', {
    params,
  });
}

/**
 * 获取设备详情 (GET /api/chat/device/{id})
 */
export async function getDeviceApi(id: string) {
  return requestClient.get<DeviceDetailDto>(`/chat/device/${id}`);
}

/**
 * 新增设备 (POST /api/chat/device)
 */
export async function createDeviceApi(data: DeviceCreateInput) {
  return requestClient.post<DeviceDetailDto>('/chat/device', data);
}

/**
 * 更新设备信息 (POST /api/chat/device/{id}/update)
 */
export async function updateDeviceApi(id: string, data: DeviceUpdateInput) {
  return requestClient.post<DeviceDetailDto>(`/chat/device/${id}/update`, data);
}

/**
 * 踢下线/删除设备
 */
export async function deleteDeviceApi(id: string) {
  return requestClient.post<void>(`/chat/device/${id}/delete`);
}

/**
 * 批量删除设备
 */
export async function deleteDevicesManyApi(idList: string[]) {
  return requestClient.post<void>('/chat/device/delete-many', idList);
}

/**
 * 为设备设置所属分组
 */
export async function setDeviceGroupsApi(id: string, groupIds: string[]) {
  return requestClient.post<number>(`/chat/device/${id}/set-groups`, groupIds);
}

// ==================== DeviceGroup API ====================

/**
 * 分页获取设备分组列表
 */
export async function getDeviceGroupListApi(
  params?: GetDeviceGroupInput,
): Promise<PagedResultDto<DeviceGroupDto>> {
  const res = await requestClient.get<any>('/chat/device-group', {
    params: {
      Keyword: params?.keyword,
      MaxResultCount: params?.maxResultCount ?? 30,
      SkipCount: params?.skipCount ?? 0,
      Sorting: params?.sorting,
    },
  });

  if (Array.isArray(res)) {
    return {
      items: res,
      totalCount: res.length,
    };
  }
  return {
    items: res?.items || [],
    totalCount: res?.totalCount ?? 0,
  };
}

/**
 * 获取全部设备分组列表（优先 /many，若后端未实现则回退至常规分页列表）
 */
/**
 * 获取全部设备分组列表
 * 直接调用 /api/chat/device-group，支持 items 结构或纯数组结构
 */
export async function getDeviceGroupsApi() {
  const res = await requestClient.get<any>('/chat/device-group', {
    params: {
      maxResultCount: 1000,
      skipCount: 0,
    },
  });

  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.items)) return res.items;
  return [];
}

/**
 * 获取设备分组详情
 */
export async function getDeviceGroupApi(id: string) {
  return requestClient.get<DeviceGroupDto>(`/chat/device-group/${id}`);
}

/**
 * 创建设备分组
 */
export async function createDeviceGroupApi(data: DeviceGroupCreateInput) {
  return requestClient.post<DeviceGroupDto>('/chat/device-group', data);
}

/**
 * 更新设备分组
 */
export async function updateDeviceGroupApi(
  id: string,
  data: DeviceGroupUpdateInput,
) {
  return requestClient.post<DeviceGroupDto>(
    `/chat/device-group/${id}/update`,
    data,
  );
}

/**
 * 删除单个设备分组
 */
export async function deleteDeviceGroupApi(id: string) {
  return requestClient.post<void>(`/chat/device-group/${id}/delete`);
}

/**
 * 批量删除设备分组
 */
export async function deleteDeviceGroupsManyApi(idList: string[]) {
  return requestClient.post<void>('/chat/device-group/delete-many', idList);
}

/**
 * 为分组设置设备列表
 */
export async function setGroupDevicesApi(id: string, deviceIds: string[]) {
  return requestClient.post<number>(
    `/chat/device-group/${id}/set-devices`,
    deviceIds,
  );
}
