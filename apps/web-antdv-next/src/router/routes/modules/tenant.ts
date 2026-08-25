import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:hotel',
      order: 20,
      title: $t('page.tenant.title', '多租户管理'),
    },
    name: 'TenantManagement',
    path: '/tenant',
    children: [
      {
        component: () => import('#/views/tenant/tenant-list.vue'),
        meta: {
          authority: ['AbpTenantManagement.Tenants', 'admin'],
          icon: 'lucide:hotel',
          title: $t('page.tenant.title', '多租户列表'),
        },
        name: 'TenantList',
        path: 'list',
      },
    ],
  },
];

export default routes;
