import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ContentDailyStatDto } from '#/api/cms';

export function useColumns(): VxeTableGridColumns<ContentDailyStatDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'statDate',
      formatter: 'formatDate',
      title: '统计日期',
      width: 120,
    },
    {
      field: 'entityType',
      title: '内容实体',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'entityId',
      title: '实体 ID',
      width: 150,
    },
    {
      field: 'viewCount',
      title: '浏览量 (PV)',
      width: 110,
    },
    {
      field: 'uniqueVisitorCount',
      title: '独立访客 (UV)',
      width: 120,
    },
    {
      field: 'likeCount',
      title: '点赞量',
      width: 90,
    },
    {
      field: 'commentCount',
      title: '评论量',
      width: 90,
    },
    {
      field: 'favoriteCount',
      title: '收藏量',
      width: 90,
    },
    {
      field: 'shareCount',
      title: '分享量',
      width: 90,
    },
    {
      field: 'totalDurationSeconds',
      title: '总停留秒数',
      width: 110,
    },
    {
      formatter: ({ cellValue }) => `${(Number(cellValue) || 0).toFixed(1)}%`,
      field: 'avgReadPercentage',
      title: '平均阅读进度',
      width: 120,
    },
  ];
}
