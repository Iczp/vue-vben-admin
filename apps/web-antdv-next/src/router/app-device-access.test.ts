import type { RouteRecordRaw } from 'vue-router';

import { describe, expect, it } from 'vitest';

import { mergeAppDevicePolicies } from '#/api/modules/app-device/permissions';

import { filterAppDeviceRoutes } from './app-device-access';
describe('independent device permissions', () => {
  it('replaces only AppDevice grants and clears them when the host is unavailable', () => {
    const main = { 'Chat.Read': true, 'AppDevice.Devices.Read': true };
    expect(
      mergeAppDevicePolicies(main, {
        'AppDevice.Groups.Read': true,
        'Chat.Write': true,
      }),
    ).toEqual({ 'Chat.Read': true, 'AppDevice.Groups.Read': true });
    expect(mergeAppDevicePolicies(main, {})).toEqual({ 'Chat.Read': true });
  });
  it('requires service grants even if legacy access accepts an administrator wildcard', () => {
    const routes: RouteRecordRaw[] = [
      { path: '/system', children: [], meta: { title: '系统管理' } },
      {
        path: '/app-device',
        children: [
          {
            path: 'devices',
            component: {},
            meta: { title: '设备管理', authority: ['AppDevice.Devices.Read'] },
          },
          {
            path: 'groups',
            component: {},
            meta: { title: '分组管理', authority: ['AppDevice.Groups.Read'] },
          },
        ],
      },
    ];
    expect(
      filterAppDeviceRoutes(routes, { '*': true, admin: true }).map(
        (r) => r.path,
      ),
    ).toEqual(['/system']);
    const selected = filterAppDeviceRoutes(routes, {
      'AppDevice.Groups.Read': true,
    });
    expect(selected[1]?.children?.map((r) => r.path)).toEqual(['groups']);
    expect(selected[1]?.redirect).toBe('/app-device/groups');
    expect(routes[1]?.children).toHaveLength(2);
  });
});
