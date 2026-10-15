import type { RouteRecordRaw } from 'vue-router';

import { appDevicePermissions as p } from '#/api/modules/app-device/permissions';

const routes: RouteRecordRaw[] = [
  {
    path: '/app-device',
    name: 'AppDeviceManagement',
    meta: { title: '应用设备', icon: 'lucide:monitor-smartphone', order: 26 },
    redirect: '/app-device/devices',
    children: [
      {
        path: 'devices',
        name: 'AppDeviceDevices',
        component: () => import('#/views/app-device/route-entry.vue'),
        props: { view: 'devices', permission: p.read },
        meta: {
          title: '设备管理',
          icon: 'lucide:smartphone',
          authority: [p.read],
        },
      },
      {
        path: 'groups',
        name: 'AppDeviceGroups',
        component: () => import('#/views/app-device/route-entry.vue'),
        props: { view: 'groups', permission: p.groups },
        meta: {
          title: '分组管理',
          icon: 'lucide:folder-tree',
          authority: [p.groups],
        },
      },
    ],
  },
];
export default routes;
