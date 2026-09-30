import { requestClient } from '#/api/request';

import type {
  AppStatisticQueryInput,
  DeviceAnalysisDto,
  DeviceDetailDto,
  DeviceDto,
  GetDevicesInput,
  PagedResultDto,
} from './types';

/**
 * 获取设备分析统计
 */
export async function getDeviceAnalysisApi(params: AppStatisticQueryInput) {
  return requestClient.get<DeviceAnalysisDto>(
    '/app-statistic/admin/device-analysis',
    { params },
  );
}

/**
 * 分页获取设备列表
 */
export async function getDevicesApi(params: GetDevicesInput) {
  return requestClient.get<PagedResultDto<DeviceDto>>(
    '/app-statistic/admin/devices',
    { params },
  );
}

/**
 * 获取设备详情
 */
export async function getDeviceDetailApi(id: string) {
  return requestClient.get<DeviceDetailDto>(
    `/app-statistic/admin/devices/${id}`,
  );
}
