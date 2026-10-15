import type { RouteRecordRaw } from 'vue-router';

import { createMemoryHistory, createRouter } from 'vue-router';

import { describe, expect, it } from 'vitest';

import { mergeAppDevicePolicies } from '#/api/modules/app-device/permissions';

import {
  filterAppDeviceRoutes,
  withAppDeviceEntryRoutes,
} from './app-device-access';
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
    const denied = filterAppDeviceRoutes(routes, { '*': true, admin: true });
    expect(denied.map((r) => r.path)).toEqual(['/system', '/app-device']);
    expect(denied[1]?.meta?.hideInMenu).toBe(true);
    expect(denied[1]?.children?.every((r) => r.meta?.hideInMenu)).toBe(true);
    const selected = filterAppDeviceRoutes(routes, {
      'AppDevice.Groups.Read': true,
    });
    expect(selected[1]?.children?.map((r) => r.path)).toEqual([
      'devices',
      'groups',
    ]);
    expect(selected[1]?.children?.map((r) => r.meta?.hideInMenu)).toEqual([
      true,
      false,
    ]);
    expect(selected[1]?.meta?.hideInMenu).toBe(false);
    expect(selected[1]?.redirect).toBe('/app-device/groups');
    expect(routes[1]?.children).toHaveLength(2);
  });
  it('resolves known device URLs inside the root layout before dynamic access initialization', async () => {
    const core: RouteRecordRaw[] = [
      { path: '/', name: 'Root', component: {}, children: [] },
    ];
    const modules: RouteRecordRaw[] = [
      {
        path: '/app-device',
        name: 'DeviceModule',
        children: [
          { path: 'devices', name: 'DeviceList', component: {} },
          { path: 'groups', name: 'DeviceGroups', component: {} },
        ],
      },
    ];
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        ...withAppDeviceEntryRoutes(core, modules),
        { path: '/:path(.*)*', name: 'NotFound', component: {} },
      ],
    });
    await router.push('/app-device/devices');
    expect(router.currentRoute.value.name).toBe('DeviceList');
    expect(router.currentRoute.value.matched.map((r) => r.name)).toEqual([
      'Root',
      'DeviceModule',
      'DeviceList',
    ]);
    await router.push('/app-device/groups');
    expect(router.currentRoute.value.name).toBe('DeviceGroups');
    expect(core[0]?.children).toEqual([]);
  });
});
