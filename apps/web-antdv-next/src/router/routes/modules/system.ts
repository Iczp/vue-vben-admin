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
          title: $t('page.openiddict.title', 'OpenIddict 客户端'),
        },
        name: 'SystemOpenIddictApps',
        path: 'openiddict-apps',
      },
      {
        component: () => import('#/views/openiddict/scope/index.vue'),
        meta: {
          authority: ['OpenIddict.Scopes', 'admin'],
          icon: 'lucide:shield-plus',
          title: 'OpenIddict 作用域',
        },
        name: 'SystemOpenIddictScopes',
        path: 'openiddict-scopes',
      },
      {
        component: () => import('#/views/system/audit-log/index.vue'),
        meta: {
          icon: 'lucide:file-search',
          title: $t('page.system.log.auditTitle', '系统审计日志'),
        },
        name: 'SystemAuditLogs',
        path: 'audit-logs',
      },
      {
        component: () => import('#/views/system/security-log/index.vue'),
        meta: {
          icon: 'lucide:shield-alert',
          title: $t('page.system.log.title', '安全登录日志'),
        },
        name: 'SystemSecurityLogs',
        path: 'security-logs',
      },
      {
        component: () => import('#/views/system/device/index.vue'),
        meta: {
          icon: 'lucide:smartphone',
          title: '登录设备管理',
        },
        name: 'SystemDevices',
        path: 'devices',
      },
      {
        component: () => import('#/views/system/app-version/index.vue'),
        meta: {
          icon: 'lucide:download-cloud',
          title: 'App 版本管理',
        },
        name: 'SystemAppVersions',
        path: 'app-versions',
      },
      {
        component: () => import('#/views/system/settings/index.vue'),
        meta: {
          authority: ['SettingManagement.Emailing', 'admin'],
          icon: 'lucide:sliders',
          title: '系统全局设置',
        },
        name: 'SystemSettings',
        path: 'settings',
      },
    ],
  },
];

export default routes;
