import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['OpenIddict.Applications', 'OpenIddict.Scopes', 'admin'],
      icon: 'lucide:shield-check',
      order: 9,
      title: $t('page.openiddict.title', 'OpenIddict 认证服务'),
    },
    name: 'OpenIddictManagement',
    path: '/openiddict',
    children: [
      {
        component: () =>
          import('#/views/openiddict/application/application-list.vue'),
        meta: {
          authority: ['OpenIddict.Applications', 'admin'],
          icon: 'lucide:app-window',
          title: $t('page.openiddict.applications', '客户端应用管理'),
        },
        name: 'OpenIddictApplications',
        path: 'applications',
      },
      {
        component: () => import('#/views/openiddict/scope/scope-list.vue'),
        meta: {
          authority: ['OpenIddict.Scopes', 'admin'],
          icon: 'lucide:shield-plus',
          title: '作用域管理 (Scopes)',
        },
        name: 'OpenIddictScopes',
        path: 'scopes',
      },
      {
        component: () =>
          import('#/views/openiddict/authorization/authorization-list.vue'),
        meta: {
          authority: ['OpenIddict.Authorizations', 'admin'],
          icon: 'lucide:key-round',
          title: '授权记录管理',
        },
        name: 'OpenIddictAuthorizations',
        path: 'authorizations',
      },
      {
        component: () => import('#/views/openiddict/token/token-list.vue'),
        meta: {
          authority: ['OpenIddict.Tokens', 'admin'],
          icon: 'lucide:ticket',
          title: '访问令牌管理',
        },
        name: 'OpenIddictTokens',
        path: 'tokens',
      },
    ],
  },
];

export default routes;
