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
        component: () => import('#/views/chat/overview/index.vue'),
        meta: {
          authority: ['ChatAdmin.Overview'],
          icon: 'lucide:layout-dashboard',
          title: 'Chat 运营总览',
        },
        name: 'ChatOverview',
        path: 'overview',
      },
      {
        component: () => import('#/views/chat/session/index.vue'),
        meta: {
          authority: ['ChatAdmin.Sessions'],
          icon: 'lucide:messages-square',
          title: '会话档案管理',
        },
        name: 'ChatSession',
        path: 'session',
      },
      {
        component: () => import('#/views/chat/message/index.vue'),
        meta: {
          authority: ['ChatAdmin.Messages'],
          icon: 'lucide:message-square-text',
          title: '消息档案查询',
        },
        name: 'ChatMessageArchive',
        path: 'message',
      },
      {
        component: () => import('#/views/chat/session-request/index.vue'),
        meta: {
          authority: ['ChatAdmin.SessionRequests'],
          icon: 'lucide:user-check',
          title: '入群与好友申请',
        },
        name: 'ChatSessionRequest',
        path: 'session-request',
      },
      {
        component: () => import('#/views/chat/session-role/index.vue'),
        meta: {
          authority: ['ChatAdmin.SessionRoles'],
          icon: 'lucide:shield-check',
          title: '群角色管理',
        },
        name: 'ChatSessionRole',
        path: 'session-role',
      },
      {
        component: () => import('#/views/chat/session-announcement/index.vue'),
        meta: {
          authority: ['ChatAdmin.SessionAnnouncements'],
          icon: 'lucide:megaphone',
          title: '群公告管理',
        },
        name: 'ChatSessionAnnouncement',
        path: 'session-announcement',
      },
      {
        component: () => import('#/views/chat/article-message/index.vue'),
        meta: {
          authority: ['ChatAdmin.ArticleMessages.Manage'],
          icon: 'lucide:newspaper',
          title: '文章消息',
        },
        name: 'ChatArticleMessage',
        path: 'article-message',
      },
      {
        component: () => import('#/views/chat/message-template/index.vue'),
        meta: {
          authority: ['ChatAdmin.MessageTemplates'],
          icon: 'lucide:layout-template',
          title: '自定义模板消息',
        },
        name: 'ChatMessageTemplate',
        path: 'message-template',
      },
      {
        component: () => import('#/views/chat/chat-object/index.vue'),
        meta: {
          authority: ['ChatAdmin.ChatObjects'],
          icon: 'lucide:contact-2',
          title: '聊天对象管理',
        },
        name: 'ChatObjects',
        path: 'chat-object',
      },
      {
        component: () => import('#/views/chat/category-type/index.vue'),
        meta: {
          authority: ['ChatAdmin.ChatObjectCategories'],
          icon: 'lucide:folder-tree',
          title: '分类与类型',
        },
        name: 'ChatCategoryType',
        path: 'category-type',
      },
      {
        component: () => import('#/views/chat/dictionary/index.vue'),
        meta: {
          authority: ['ChatAdmin.EntryNames'],
          icon: 'lucide:book-open-check',
          title: '数据字典管理',
        },
        name: 'ChatDictionary',
        path: 'dictionary',
      },
      {
        component: () => import('#/views/chat/online/index.vue'),
        meta: {
          authority: ['ChatAdmin.Online'],
          icon: 'lucide:activity',
          title: '在线连接池',
        },
        name: 'ChatOnline',
        path: 'online',
      },
      {
        component: () => import('#/views/chat/invitation-code/index.vue'),
        meta: {
          authority: ['ChatAdmin.InvitationCodes'],
          icon: 'lucide:ticket',
          title: '邀请码管理',
        },
        name: 'ChatInvitationCode',
        path: 'invitation-code',
      },
      {
        component: () => import('#/views/chat/message-report/index.vue'),
        meta: {
          authority: ['ChatAdmin.MessageReports'],
          icon: 'lucide:bar-chart-3',
          title: '消息报表统计',
        },
        name: 'ChatMessageReport',
        path: 'message-report',
      },
      {
        component: () => import('#/views/chat/blob/index.vue'),
        meta: {
          authority: ['ChatAdmin.Blobs'],
          icon: 'lucide:database',
          title: '对象存储 (Blob)',
        },
        name: 'ChatBlob',
        path: 'blob',
      },
      {
        component: () => import('#/views/chat/scan-code/index.vue'),
        meta: {
          authority: ['ChatAdmin.ScanCodes'],
          icon: 'lucide:qr-code',
          title: '扫码服务流水',
        },
        name: 'ChatScanCode',
        path: 'scan-code',
      },
      {
        component: () => import('#/views/chat/ai-run/index.vue'),
        meta: {
          authority: ['ChatAdmin.AiRuns'],
          icon: 'lucide:bot',
          title: 'AI任务执行记录',
        },
        name: 'ChatAiRun',
        path: 'ai-run',
      },
      {
        component: () => import('#/views/chat/url-security-rule/index.vue'),
        meta: {
          authority: ['ChatAdmin.UrlSecurityRules'],
          icon: 'lucide:shield-alert',
          title: 'URL 风控规则',
        },
        name: 'ChatUrlSecurityRule',
        path: 'url-security-rule',
      },
      {
        component: () => import('#/views/chat/security-report/index.vue'),
        meta: {
          authority: ['ChatAdmin.SecurityReports'],
          icon: 'lucide:flag',
          title: '违规举报工单',
        },
        name: 'ChatSecurityReport',
        path: 'security-report',
      },
    ],
  },
];

export default routes;
