import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings-2',
      order: 10,
      title: $t('page.system.title', '系统管理'),
    },
    name: 'SystemManagement',
    path: '/system',
    children: [
      {
        component: () => import('#/views/identity/user/index.vue'),
        meta: {
          authority: ['AbpIdentity.Users', 'admin'],
          icon: 'lucide:users',
          title: $t('page.identity.user.title', '用户管理'),
        },
        name: 'SystemUsers',
        path: 'users',
      },
      {
        component: () => import('#/views/identity/role/index.vue'),
        meta: {
          authority: ['AbpIdentity.Roles', 'admin'],
          icon: 'lucide:user-check',
          title: $t('page.identity.role.title', '角色管理'),
        },
        name: 'SystemRoles',
        path: 'roles',
      },
      {
        component: () => import('#/views/openiddict/application/index.vue'),
        meta: {
          authority: ['OpenIddict.Applications', 'admin'],
          icon: 'lucide:key-round',
          title: $t('page.openiddict.title', 'OpenIddict 认证'),
        },
        name: 'SystemOpenIddict',
        path: 'openiddict',
      },
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
