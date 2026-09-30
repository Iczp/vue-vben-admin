import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { CommentDto } from '#/api/cms';

import { CommentStatus } from '#/api/cms';

export const commentStatusOptions = [
  { color: 'processing', label: '待审核', value: CommentStatus.PendingReview },
  { color: 'success', label: '已通过', value: CommentStatus.Approved },
  { color: 'error', label: '已拒绝', value: CommentStatus.Rejected },
  { color: 'warning', label: '已隐藏', value: CommentStatus.Hidden },
  { color: 'default', label: '已删除', value: CommentStatus.Deleted },
];

export function useColumns(
  onActionClick: OnActionClickFn<CommentDto>,
): VxeTableGridColumns<CommentDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      align: 'left',
      field: 'content',
      minWidth: 260,
      showOverflow: 'tooltip',
      title: '评论内容',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: commentStatusOptions,
      },
      field: 'status',
      title: '状态',
      width: 95,
    },
    {
      field: 'actorName',
      title: '评论人',
      width: 120,
    },
    {
      field: 'entityType',
      title: '所属实体',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'entityId',
      title: '目标 ID',
      width: 140,
    },
    {
      field: 'likeCount',
      title: '点赞',
      width: 75,
    },
    {
      field: 'replyCount',
      title: '回复数',
      width: 75,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '评论时间',
      width: 160,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'content',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'approve',
            props: { type: 'link' },
            show: (row: CommentDto) =>
              row.status === CommentStatus.PendingReview ||
              row.status === CommentStatus.Rejected ||
              row.status === CommentStatus.Hidden,
            text: '通过',
          },
          {
            code: 'reject',
            props: { danger: true },
            show: (row: CommentDto) =>
              row.status === CommentStatus.PendingReview ||
              row.status === CommentStatus.Approved,
            text: '驳回',
          },
          {
            code: 'hide',
            show: (row: CommentDto) =>
              row.status === CommentStatus.Approved,
            text: '隐藏',
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
      width: 170,
    },
  ];
}
