import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 40,
      title: $t('page.system.title', '系统管理'),
    },
    name: 'SystemManagement',
    path: '/system',
    children: [
      {
        component: () => import('#/views/system/security-log/index.vue'),
        meta: {
          icon: 'lucide:shield-alert',
          title: $t('page.system.log.title', '安全审计日志'),
        },
        name: 'SystemSecurityLogs',
        path: 'security-logs',
      },
    ],
  },
];

export default routes;
