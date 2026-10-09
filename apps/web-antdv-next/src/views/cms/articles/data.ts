import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AdminArticleListItemDto } from '#/api/cms';

import { ArticleStatus } from '#/api/cms';

export const articleStatusOptions = [
  { color: 'default', label: '草稿', value: ArticleStatus.Draft },
  { color: 'processing', label: '待审核', value: ArticleStatus.PendingReview },
  { color: 'cyan', label: '已审核', value: ArticleStatus.Approved },
  { color: 'purple', label: '定时发布', value: ArticleStatus.Scheduled },
  { color: 'success', label: '已发布', value: ArticleStatus.Published },
  { color: 'warning', label: '已下架', value: ArticleStatus.Offline },
  { color: 'error', label: '已归档', value: ArticleStatus.Archived },
];

export const contentTypeOptions = [
  { color: 'blue', label: '标准图文', value: 'Article' },
  { color: 'blue', label: '标准图文', value: 'article' },
  { color: 'cyan', label: '快讯要闻', value: 'News' },
  { color: 'cyan', label: '快讯要闻', value: 'news' },
  { color: 'orange', label: '通知公告', value: 'Notice' },
  { color: 'orange', label: '通知公告', value: 'notice' },
  { color: 'purple', label: '图集画廊', value: 'Gallery' },
  { color: 'purple', label: '图集画廊', value: 'gallery' },
  { color: 'red', label: '视频内容', value: 'Video' },
  { color: 'red', label: '视频内容', value: 'video' },
  { color: 'green', label: '百科词条', value: 'Wiki' },
  { color: 'green', label: '百科词条', value: 'wiki' },
  { color: 'gold', label: '外部转存', value: 'Wechat' },
  { color: 'gold', label: '外部转存', value: 'wechat' },
];

export function useColumns(
  onActionClick: OnActionClickFn<AdminArticleListItemDto>,
): VxeTableGridColumns<AdminArticleListItemDto> {
  return [
    {
      fixed: 'left',
      type: 'checkbox',
      width: 45,
    },
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      cellRender: {
        name: 'CellImage',
        props: {
          height: 40,
          width: 55,
        },
      },
      field: 'coverUrl',
      title: '封面',
      width: 75,
    },
    {
      align: 'left',
      field: 'title',
      minWidth: 220,
      showOverflow: 'ellipsis',
      title: '文章标题',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: contentTypeOptions,
      },
      field: 'contentType',
      title: '内容形态',
      width: 105,
    },
    {
      cellRender: {
        name: 'CellTag',
        props: {
          color: 'cyan',
        },
      },
      field: 'categories',
      minWidth: 140,
      title: '所属分类',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'code',
      title: '短代码',
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
      },
      field: 'tags',
      minWidth: 140,
      title: '标签',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: articleStatusOptions,
      },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'red', label: '置顶', value: true },
          { color: 'default', label: '普通', value: false },
        ],
      },
      field: 'isTop',
      title: '置顶',
      width: 75,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'orange', label: '推荐', value: true },
          { color: 'default', label: '普通', value: false },
        ],
      },
      field: 'isRecommend',
      title: '推荐',
      width: 75,
    },
    {
      field: 'viewCount',
      title: '阅读量',
      width: 85,
    },
    {
      field: 'likeCount',
      title: '点赞',
      width: 70,
    },
    {
      field: 'commentCount',
      title: '评论',
      width: 70,
    },
    {
      field: 'sorting',
      title: '排序',
      width: 75,
    },
    {
      field: 'publishTime',
      formatter: 'formatDateTime',
      title: '发布时间',
      width: 160,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 160,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'title',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: '编辑' },
          { code: 'revisions', text: '版本' },
          {
            code: 'review',
            show: (row: AdminArticleListItemDto) =>
              row.status === ArticleStatus.Draft ||
              row.status === ArticleStatus.PendingReview,
            text: '审核',
          },
          {
            code: 'publish',
            props: { type: 'link' },
            show: (row: AdminArticleListItemDto) =>
              row.status === ArticleStatus.Approved ||
              row.status === ArticleStatus.Offline ||
              row.status === ArticleStatus.Draft,
            text: '发布',
          },
          {
            code: 'schedule',
            show: (row: AdminArticleListItemDto) =>
              row.status === ArticleStatus.Approved ||
              row.status === ArticleStatus.Draft,
            text: '定时',
          },
          {
            code: 'offline',
            props: { danger: true },
            show: (row: AdminArticleListItemDto) =>
              row.status === ArticleStatus.Published,
            text: '下架',
          },
          {
            code: 'archive',
            show: (row: AdminArticleListItemDto) =>
              row.status === ArticleStatus.Offline ||
              row.status === ArticleStatus.Published,
            text: '归档',
          },
          {
            code: 'delete',
            props: { danger: true },
            text: '删除',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 320,
    },
  ];
}
