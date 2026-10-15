import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAbpStore } from './abp';

const api = vi.hoisted(() => ({
  main: vi.fn(),
  device: vi.fn(),
  access: vi.fn(),
  user: vi.fn(),
}));
vi.mock('#/api/abp', () => ({ getApplicationConfigurationApi: api.main }));
vi.mock('#/api/modules/app-device', () => ({
  getAppDeviceConfiguration: api.device,
}));
vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ setAccessCodes: api.access }),
  useUserStore: () => ({ setUserInfo: api.user }),
}));
beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());
  api.main.mockResolvedValue({
    currentUser: { id: 'user-a' },
    currentTenant: { id: 'tenant-a' },
    setting: { values: { theme: 'dark' } },
    auth: { grantedPolicies: { 'Chat.Read': true } },
  });
  api.device.mockResolvedValue({
    auth: { grantedPolicies: { 'AppDevice.Devices.Read': true } },
  });
});
describe('device permission refresh', () => {
  it('refreshes device policies without replacing the primary identity or other policies', async () => {
    const store = useAbpStore();
    await store.fetchApplicationConfiguration();
    api.device.mockResolvedValue({
      currentUser: { id: 'different-user' },
      auth: {
        grantedPolicies: { 'AppDevice.Groups.Read': true, 'Chat.Write': true },
      },
    });
    await store.refreshAppDeviceConfiguration();
    expect(store.currentUser?.id).toBe('user-a');
    expect(store.currentTenant?.id).toBe('tenant-a');
    expect(store.settings).toEqual({ theme: 'dark' });
    expect(store.grantedPolicies).toEqual({
      'Chat.Read': true,
      'AppDevice.Groups.Read': true,
    });
    expect(store.appDeviceConfigurationLoaded).toBe(true);
  });
  it('clears stale device grants on a service failure and allows a retry', async () => {
    const store = useAbpStore();
    await store.fetchApplicationConfiguration();
    api.device.mockRejectedValueOnce(new Error('offline'));
    await store.refreshAppDeviceConfiguration();
    expect(store.grantedPolicies).toEqual({ 'Chat.Read': true });
    expect(store.appDeviceConfigurationError).toBe(true);
    api.device.mockResolvedValue({
      auth: { grantedPolicies: { 'AppDevice.Devices.Read': true } },
    });
    await store.refreshAppDeviceConfiguration();
    expect(store.hasPermission('AppDevice.Devices.Read')).toBe(true);
    expect(store.appDeviceConfigurationError).toBe(false);
  });
  it('ignores a late response after logout', async () => {
    const store = useAbpStore();
    await store.fetchApplicationConfiguration();
    let finish: ((value: object) => void) | undefined;
    api.device.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const request = store.refreshAppDeviceConfiguration();
    store.$reset();
    finish?.({ auth: { grantedPolicies: { 'AppDevice.Devices.Read': true } } });
    await request;
    expect(store.grantedPolicies).toEqual({});
    expect(store.applicationConfig).toBeNull();
    expect(store.appDeviceConfigurationLoaded).toBe(false);
  });
});
