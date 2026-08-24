import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:key-round',
      order: 30,
      title: $t('page.openiddict.title', 'OpenIddict 认证'),
    },
    name: 'OpenIddictManagement',
    path: '/openiddict',
    children: [
      {
        component: () => import('#/views/openiddict/application/index.vue'),
        meta: {
          icon: 'lucide:app-window',
          title: $t('page.openiddict.applications', '客户端应用'),
        },
        name: 'OpenIddictApplications',
        path: 'applications',
      },
    ],
  },
];

export default routes;
