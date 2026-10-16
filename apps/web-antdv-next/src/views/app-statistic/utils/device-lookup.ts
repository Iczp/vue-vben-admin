import type { DeviceDto } from '#/api/app-statistic/types';

import { getDeviceDetailApi } from '#/api/app-statistic/device';

// 内存设备详情缓存
const deviceCache = new Map<string, DeviceDto | null>();
const pendingDevicePromises = new Map<string, Promise<DeviceDto | null>>();

/**
 * 获取设备的友好展示名称
 * 优先读取 extraProperties 中的 deviceName，次选 Manufacturer + Model，再次为 Platform，最后为 DeviceKey
 */
export function getDeviceDisplayName(
  device?: null | Partial<DeviceDto>,
): string {
  if (!device) return '未知设备';

  // 1. 尝试从附加属性中解析明确的设备名称 (如 iOS/Android 客户端采集的 deviceName)
  if (device.extraPropertiesJson) {
    try {
      const extra = JSON.parse(device.extraPropertiesJson);
      const customName =
        extra.deviceName || extra.device_name || extra.name || extra.modelName;
      if (customName && typeof customName === 'string' && customName.trim()) {
        return customName.trim();
      }
    } catch {
      // ignore
    }
  }

  // 2. 厂商与型号组合 (例如 Apple iPhone 15 Pro, Xiaomi 14)
  const m = device.manufacturer?.trim();
  const model = device.model?.trim();

  if (m && model) {
    if (model.toLowerCase().includes(m.toLowerCase())) {
      return model;
    }
    return `${m} ${model}`;
  }

  if (model) return model;
  if (m) return `${m} 设备`;

  // 3. 平台类型 (如 iOS 设备, Android 设备)
  if (device.platform) {
    return `${device.platform} 设备`;
  }

  // 4. 退化使用 DeviceKey 或 ID
  if (device.deviceKey) {
    return device.deviceKey.length > 12
      ? `${device.deviceKey.slice(0, 12)}...`
      : device.deviceKey;
  }

  return '未知设备';
}

/**
 * 根据 DeviceId 查询设备信息（带内存缓存与去重）
 */
export async function lookupDevice(
  deviceId?: string,
): Promise<DeviceDto | null> {
  if (!deviceId || deviceId === '00000000-0000-0000-0000-000000000000') {
    return null;
  }

  const normalizedId = deviceId.toLowerCase();

  if (deviceCache.has(normalizedId)) {
    return deviceCache.get(normalizedId) ?? null;
  }

  if (pendingDevicePromises.has(normalizedId)) {
    return pendingDevicePromises.get(normalizedId)!;
  }

  const promise = getDeviceDetailApi(normalizedId)
    .then((res) => {
      const dev = res.device;
      deviceCache.set(normalizedId, dev);
      return dev;
    })
    .catch(() => {
      deviceCache.set(normalizedId, null);
      return null;
    })
    .finally(() => {
      pendingDevicePromises.delete(normalizedId);
    });

  pendingDevicePromises.set(normalizedId, promise);
  return promise;
}
