import { describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('#/api/request', () => ({ requestClient: api }));
import { logoutAppDevice } from './index';

describe('device session logout', () => {
  it('logs out the selected application/device without deleting its profile', async () => {
    const result = {
      deviceRecordId: 'record',
      revokedSessions: 1,
      disconnectRequested: true,
    };
    api.post.mockResolvedValueOnce(result);
    expect(await logoutAppDevice('app-A', 'offline-device')).toEqual(result);
    expect(api.post).toHaveBeenCalledWith(
      '/app-device/admin/device-admin/logout',
      {
        appId: 'app-A',
        deviceId: 'offline-device',
        allUsers: true,
        reason: '管理员已退出该设备登录，请重新登录。',
      },
    );
  });
  it('keeps a failed logout rejected so the page cannot report success', async () => {
    api.post.mockRejectedValueOnce(new Error('forbidden'));
    await expect(logoutAppDevice('app-A', 'device')).rejects.toThrow(
      'forbidden',
    );
  });
});
