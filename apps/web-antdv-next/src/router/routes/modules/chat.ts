import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:messages-square',
      order: 20,
      title: '即时通讯管理',
    },
    name: 'ChatManagement',
    path: '/chat',
    children: [
      {
        component: () => import('#/views/chat/chat-object/index.vue'),
        meta: {
          icon: 'lucide:contact-2',
          title: '聊天对象管理',
        },
        name: 'ChatObjects',
        path: 'chat-object',
      },
      {
        component: () => import('#/views/chat/category-type/index.vue'),
        meta: {
          icon: 'lucide:folder-tree',
          title: '分类与类型',
        },
        name: 'ChatCategoryType',
        path: 'category-type',
      },
      {
        component: () => import('#/views/chat/dictionary/index.vue'),
        meta: {
          icon: 'lucide:book-open-check',
          title: '数据字典管理',
        },
        name: 'ChatDictionary',
        path: 'dictionary',
      },
      {
        component: () => import('#/views/chat/online/index.vue'),
        meta: {
          icon: 'lucide:activity',
          title: '在线连接池',
        },
        name: 'ChatOnline',
        path: 'online',
      },
      {
        component: () => import('#/views/chat/invitation-code/index.vue'),
        meta: {
          icon: 'lucide:ticket',
          title: '邀请码管理',
        },
        name: 'ChatInvitationCode',
        path: 'invitation-code',
      },
      {
        component: () => import('#/views/chat/message-report/index.vue'),
        meta: {
          icon: 'lucide:bar-chart-3',
          title: '消息报表统计',
        },
        name: 'ChatMessageReport',
        path: 'message-report',
      },
      {
        component: () => import('#/views/chat/blob/index.vue'),
        meta: {
          icon: 'lucide:database',
          title: '对象存储 (Blob)',
        },
        name: 'ChatBlob',
        path: 'blob',
      },
      {
        component: () => import('#/views/chat/scan-code/index.vue'),
        meta: {
          icon: 'lucide:qr-code',
          title: '扫码服务流水',
        },
        name: 'ChatScanCode',
        path: 'scan-code',
      },
    ],
  },
];

export default routes;
