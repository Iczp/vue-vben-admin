import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:newspaper',
      order: 15,
      title: '内容管理 (CMS)',
    },
    name: 'CmsManagement',
    path: '/cms',
    redirect: '/cms/dashboard',
    children: [
      {
        component: () => import('#/views/cms/dashboard/index.vue'),
        meta: {
          icon: 'lucide:layout-dashboard',
          title: 'CMS 工作台',
        },
        name: 'CmsDashboard',
        path: 'dashboard',
      },
      {
        component: () => import('#/views/cms/articles/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: '文章管理',
        },
        name: 'CmsArticles',
        path: 'articles',
      },
      {
        component: () => import('#/views/cms/articles/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: '编辑文章',
        },
        name: 'CmsArticleDetail',
        path: 'articles/:id',
      },
      {
        component: () => import('#/views/cms/categories/index.vue'),
        meta: {
          icon: 'lucide:folder-tree',
          title: '栏目分类',
        },
        name: 'CmsCategories',
        path: 'categories',
      },
      {
        component: () => import('#/views/cms/tags/index.vue'),
        meta: {
          icon: 'lucide:tags',
          title: '标签管理',
        },
        name: 'CmsTags',
        path: 'tags',
      },
      {
        component: () => import('#/views/cms/content-types/index.vue'),
        meta: {
          icon: 'lucide:layers',
          title: '内容形态',
        },
        name: 'CmsContentTypes',
        path: 'content-types',
      },
      {
        component: () => import('#/views/cms/assets/index.vue'),
        meta: {
          icon: 'lucide:image',
          title: '素材媒体库',
        },
        name: 'CmsAssets',
        path: 'assets',
      },
      {
        component: () => import('#/views/cms/comments/index.vue'),
        meta: {
          icon: 'lucide:message-square',
          title: '评论管理',
        },
        name: 'CmsComments',
        path: 'comments',
      },
      {
        component: () => import('#/views/cms/moderation/index.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: '风控机审',
        },
        name: 'CmsModeration',
        path: 'moderation',
      },
      {
        component: () => import('#/views/cms/sensitive-words/index.vue'),
        meta: {
          icon: 'lucide:shield-alert',
          title: '敏感词库',
        },
        name: 'CmsSensitiveWords',
        path: 'sensitive-words',
      },
      {
        component: () =>
          import('#/views/cms/sensitive-word-whitelists/index.vue'),
        meta: {
          icon: 'lucide:shield-check',
          title: '敏感词白名单',
        },
        name: 'CmsSensitiveWordWhitelists',
        path: 'sensitive-word-whitelists',
      },
      {
        component: () => import('#/views/cms/sensitive-word-sources/index.vue'),
        meta: {
          icon: 'lucide:database',
          title: '词库数据源',
        },
        name: 'CmsSensitiveWordSources',
        path: 'sensitive-word-sources',
      },
      {
        component: () =>
          import('#/views/cms/sensitive-word-sync-batches/index.vue'),
        meta: {
          icon: 'lucide:git-compare',
          title: '词库同步批次',
        },
        name: 'CmsSensitiveWordSyncBatches',
        path: 'sensitive-word-sync-batches',
      },
      {
        component: () =>
          import('#/views/cms/sensitive-word-rule-versions/index.vue'),
        meta: {
          icon: 'lucide:history',
          title: '规则版本发布',
        },
        name: 'CmsSensitiveWordRuleVersions',
        path: 'sensitive-word-rule-versions',
      },
      {
        component: () => import('#/views/cms/moderation-rules/index.vue'),
        meta: {
          icon: 'lucide:cpu',
          title: '规则调试台',
        },
        name: 'CmsModerationRules',
        path: 'moderation-rules',
      },
      {
        component: () => import('#/views/cms/recommendations/index.vue'),
        meta: {
          icon: 'lucide:sparkles',
          title: '推荐规则',
        },
        name: 'CmsRecommendations',
        path: 'recommendations',
      },
      {
        component: () => import('#/views/cms/promotions/index.vue'),
        meta: {
          icon: 'lucide:arrow-up-circle',
          title: '置顶推广',
        },
        name: 'CmsPromotions',
        path: 'promotions',
      },
      {
        component: () => import('#/views/cms/sources/index.vue'),
        meta: {
          icon: 'lucide:git-pull-request',
          title: '数据源采集',
        },
        name: 'CmsSources',
        path: 'sources',
      },
      {
        component: () => import('#/views/cms/redirects/index.vue'),
        meta: {
          icon: 'lucide:external-link',
          title: '重定向规则',
        },
        name: 'CmsRedirects',
        path: 'redirects',
      },
      {
        component: () => import('#/views/cms/statistics/index.vue'),
        meta: {
          icon: 'lucide:bar-chart-2',
          title: '内容统计',
        },
        name: 'CmsStatistics',
        path: 'statistics',
      },
    ],
  },
];

export default routes;
