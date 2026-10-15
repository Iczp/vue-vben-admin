export interface DeviceProfile {
  name?: null | string;
  platform?: null | string;
  deviceType?: null | string;
  brand?: null | string;
  model?: null | string;
  osVersion?: null | string;
  appVersion?: null | string;
}

export interface AppDevice {
  id: string;
  tenantId?: null | string;
  appId: string;
  deviceId: string;
  profile: DeviceProfile;
  isEnabled: boolean;
  revision: number;
  creationTime: string;
  concurrencyStamp: string;
  groupIds: string[];
  lastSeenTime?: null | string;
}

export interface CursorPage<T> {
  items: T[];
  nextId?: null | string;
}
export interface CursorInput {
  afterId?: string;
  take?: number;
}
export interface DeviceQuery extends CursorInput {
  appId: string;
  keyword?: string;
  platform?: string;
  enabled?: boolean;
  userId?: string;
  groupId?: string;
}
export interface DeviceEdit {
  appId: string;
  concurrencyStamp: string;
  profile?: DeviceProfile;
}
export interface DeviceGroup {
  id: string;
  appId: string;
  name: string;
  description?: null | string;
  concurrencyStamp: string;
}
export interface GroupEdit {
  appId: string;
  name: string;
  description?: string;
  concurrencyStamp?: string;
}
export interface DeviceBinding {
  id: string;
  userId: string;
  deviceRecordId: string;
  boundAt: string;
}
export interface DeviceOperation {
  id: string;
  state: string;
  total: number;
  processed: number;
  attempts: number;
  errorCode?: null | string;
  nextAttemptAt?: null | string;
}
export interface GroupOperationInput {
  appId: string;
  groupId: string;
  requestKey: string;
  add: boolean;
  deviceRecordIds: string[];
}
