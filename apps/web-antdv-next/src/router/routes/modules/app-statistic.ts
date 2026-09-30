import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:bar-chart-3',
      order: 25,
      title: 'App 统计',
    },
    name: 'AppStatistic',
    path: '/app-statistic',
    redirect: '/app-statistic/overview',
    children: [
      {
        component: () => import('#/views/app-statistic/overview/index.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: '数据概览',
        },
        name: 'AppStatisticOverview',
        path: 'overview',
      },
      {
        component: () => import('#/views/app-statistic/activity/index.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '活跃分析',
        },
        name: 'AppStatisticActivity',
        path: 'activity',
      },
      {
        component: () => import('#/views/app-statistic/device/index.vue'),
        meta: {
          icon: 'lucide:smartphone',
          title: '设备分析',
        },
        name: 'AppStatisticDevice',
        path: 'device',
      },
      {
        component: () => import('#/views/app-statistic/version/index.vue'),
        meta: {
          icon: 'lucide:git-branch',
          title: '版本分析',
        },
        name: 'AppStatisticVersion',
        path: 'version',
      },
      {
        component: () => import('#/views/app-statistic/channel/index.vue'),
        meta: {
          icon: 'lucide:share-2',
          title: '渠道分析',
        },
        name: 'AppStatisticChannel',
        path: 'channel',
      },
      {
        component: () => import('#/views/app-statistic/page/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '页面分析',
        },
        name: 'AppStatisticPage',
        path: 'page',
      },
      {
        component: () => import('#/views/app-statistic/retention/index.vue'),
        meta: {
          icon: 'lucide:repeat',
          title: '留存分析',
        },
        name: 'AppStatisticRetention',
        path: 'retention',
      },
      {
        component: () => import('#/views/app-statistic/events/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '事件分析',
        },
        name: 'AppStatisticEvents',
        path: 'events',
      },
      {
        component: () => import('#/views/app-statistic/devices/index.vue'),
        meta: {
          icon: 'lucide:tablet-smartphone',
          title: '设备列表',
        },
        name: 'AppStatisticDevices',
        path: 'devices',
      },
      {
        component: () => import('#/views/app-statistic/devices/detail.vue'),
        meta: {
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
