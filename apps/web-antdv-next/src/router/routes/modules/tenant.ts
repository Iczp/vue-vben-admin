import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['AbpTenantManagement.Tenants'],
      icon: 'lucide:building-2',
      order: 20,
      title: $t('page.tenant.title', '多租户管理'),
    },
    name: 'TenantManagement',
    path: '/tenants',
    children: [
      {
        component: () => import('#/views/tenant/index.vue'),
        meta: {
          authority: ['AbpTenantManagement.Tenants'],
          icon: 'lucide:building',
          title: $t('page.tenant.title', '租户列表'),
        },
        name: 'TenantList',
        path: 'list',
      },
    ],
  },
];

export default routes;
