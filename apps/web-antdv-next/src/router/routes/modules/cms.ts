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
