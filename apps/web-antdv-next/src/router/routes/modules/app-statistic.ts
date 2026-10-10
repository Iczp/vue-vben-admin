import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bar-chart-3',
      order: 25,
      title: $t('appStatistic.title'),
    },
    name: 'AppStatistic',
    path: '/app-statistic',
    redirect: '/app-statistic/apps',
    children: [
      {
        component: () => import('#/views/app-statistic/apps/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Default'],
          icon: 'lucide:layout-grid',
          title: $t('appStatistic.home'),
        },
        name: 'AppStatisticHome',
        path: 'apps',
      },
      {
        component: () => import('#/views/app-statistic/overview/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Overview'],
          icon: 'lucide:layout-dashboard',
          title: $t('appStatistic.text006'),
        },
        name: 'AppStatisticOverview',
        path: 'overview',
      },
      {
        component: () => import('#/views/app-statistic/activity/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Analytics'],
          icon: 'lucide:activity',
          title: $t('appStatistic.text001'),
        },
        name: 'AppStatisticActivity',
        path: 'activity',
      },
      {
        component: () => import('#/views/app-statistic/device/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Analytics'],
          icon: 'lucide:smartphone',
          title: $t('appStatistic.text003'),
        },
        name: 'AppStatisticDevice',
        path: 'device',
      },
      {
        component: () => import('#/views/app-statistic/version/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Analytics'],
          icon: 'lucide:git-branch',
          title: $t('appStatistic.text009'),
        },
        name: 'AppStatisticVersion',
        path: 'version',
      },
      {
        component: () => import('#/views/app-statistic/channel/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Analytics'],
          icon: 'lucide:share-2',
          title: $t('appStatistic.text002'),
        },
        name: 'AppStatisticChannel',
        path: 'channel',
      },
      {
        component: () => import('#/views/app-statistic/page/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Analytics'],
          icon: 'lucide:file-text',
          title: $t('appStatistic.text007'),
        },
        name: 'AppStatisticPage',
        path: 'page',
      },
      {
        component: () => import('#/views/app-statistic/retention/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Retention'],
          icon: 'lucide:repeat',
          title: $t('appStatistic.text008'),
        },
        name: 'AppStatisticRetention',
        path: 'retention',
      },
      {
        component: () => import('#/views/app-statistic/events/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Events'],
          icon: 'lucide:list',
          title: $t('appStatistic.text010'),
        },
        name: 'AppStatisticEvents',
        path: 'events',
      },
      {
        component: () => import('#/views/app-statistic/devices/index.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Devices'],
          icon: 'lucide:tablet-smartphone',
          title: $t('appStatistic.text004'),
        },
        name: 'AppStatisticDevices',
        path: 'devices',
      },
      {
        component: () => import('#/views/app-statistic/devices/detail.vue'),
        meta: {
          authority: ['AppStatistic.Admin.Devices'],
          hideInMenu: true,
          title: '设备详情',
        },
        name: 'AppStatisticDeviceDetail',
        path: 'devices/:id',
      },
    ],
  },
];

export default routes;
