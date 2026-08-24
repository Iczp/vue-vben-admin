import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      authority: ['AbpIdentity.Users', 'AbpIdentity.Roles'],
      icon: 'lucide:shield-check',
      order: 10,
      title: $t('page.identity.title', '身份认证管理'),
    },
    name: 'IdentityManagement',
    path: '/identity',
    children: [
      {
        component: () => import('#/views/identity/user/index.vue'),
        meta: {
          authority: ['AbpIdentity.Users'],
          icon: 'lucide:users',
          title: $t('page.identity.user.title', '用户管理'),
        },
        name: 'IdentityUsers',
        path: 'users',
      },
      {
        component: () => import('#/views/identity/role/index.vue'),
        meta: {
          authority: ['AbpIdentity.Roles'],
          icon: 'lucide:user-check',
          title: $t('page.identity.role.title', '角色管理'),
        },
        name: 'IdentityRoles',
        path: 'roles',
      },
    ],
  },
];

export default routes;
