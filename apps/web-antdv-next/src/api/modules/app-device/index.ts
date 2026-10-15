import type {
  AppDevice,
  CursorInput,
  CursorPage,
  DeviceBinding,
  DeviceEdit,
  DeviceGroup,
  DeviceOperation,
  DeviceQuery,
  GroupEdit,
  GroupOperationInput,
} from './types';

import type { ApplicationConfigurationDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export type * from './types';
const base = '/app-device/admin';
export const getAppDeviceConfiguration = () =>
  requestClient.get<ApplicationConfigurationDto>(
    '/app-device/abp/application-configuration',
    { params: { includeLocalizationResources: false }, timeout: 10_000 },
  );
export const getAppDevices = (params: DeviceQuery) =>
  requestClient.get<CursorPage<AppDevice>>(`${base}/devices`, { params });
export const getAppDevice = (appId: string, id: string) =>
  requestClient.get<AppDevice>(`${base}/devices/${id}`, { params: { appId } });
export const editAppDevice = (id: string, input: DeviceEdit) =>
  requestClient.request<AppDevice>(`${base}/devices/${id}`, {
    method: 'PATCH',
    data: input,
  });
export const setAppDeviceState = (
  id: string,
  operation: 'delete' | 'disable' | 'enable',
  input: DeviceEdit,
) =>
  requestClient.post<AppDevice | null>(
    `${base}/devices/${id}/${operation}`,
    input,
  );
export const getAppDeviceBindings = (
  appId: string,
  id: string,
  params: CursorInput,
) =>
  requestClient.get<DeviceBinding[]>(`${base}/devices/${id}/bindings`, {
    params: { appId, ...params },
  });
export const getAppDeviceGroups = (appId: string, params: CursorInput) =>
  requestClient.get<CursorPage<DeviceGroup>>(`${base}/groups`, {
    params: { appId, ...params },
  });
export const createAppDeviceGroup = (input: GroupEdit) =>
  requestClient.post<DeviceGroup>(`${base}/groups`, input);
export const editAppDeviceGroup = (id: string, input: GroupEdit) =>
  requestClient.request<DeviceGroup>(`${base}/groups/${id}`, {
    method: 'PATCH',
    data: input,
  });
export const deleteAppDeviceGroup = (id: string, input: GroupEdit) =>
  requestClient.post<DeviceGroup>(`${base}/groups/${id}/delete`, input);
export const getAppDeviceGroupMembers = (
  appId: string,
  groupId: string,
  params: CursorInput,
) =>
  requestClient.get<CursorPage<AppDevice>>(
    `${base}/groups/${groupId}/members`,
    { params: { appId, ...params } },
  );
export async function updateAppDeviceGroupMembers(
  appId: string,
  groupId: string,
  deviceRecordIds: string[],
  add: boolean,
): Promise<void> {
  await requestClient.post<unknown>(
    `${base}/groups/${groupId}/members`,
    { appId, deviceRecordIds },
    { params: { add } },
  );
}
export const submitAppDeviceOperation = (input: GroupOperationInput) =>
  requestClient.post<DeviceOperation>(`${base}/operations`, input);
export const getAppDeviceOperation = (appId: string, id: string) =>
  requestClient.get<DeviceOperation>(`${base}/operations/${id}`, {
    params: { appId },
  });
