import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SensitiveWordSyncBatchDto } from '#/api/cms';

import {
  SensitiveWordApplyStatus,
  SensitiveWordBatchStatus,
  SensitiveWordChangeType,
} from '#/api/cms';

export const batchStatusOptions = [
  { color: 'warning', label: '待审核', value: SensitiveWordBatchStatus.PendingReview },
  { color: 'processing', label: '应用中', value: SensitiveWordBatchStatus.Applying },
  { color: 'success', label: '已应用', value: SensitiveWordBatchStatus.Applied },
  { color: 'default', label: '已忽略', value: SensitiveWordBatchStatus.Ignored },
  { color: 'error', label: '应用失败', value: SensitiveWordBatchStatus.Failed },
  { color: 'default', label: '已废弃', value: SensitiveWordBatchStatus.Superseded },
];

export const changeTypeOptions = [
  { color: 'success', label: '新增', value: SensitiveWordChangeType.Added },
  { color: 'processing', label: '更新', value: SensitiveWordChangeType.Updated },
  { color: 'error', label: '移除', value: SensitiveWordChangeType.Removed },
  { color: 'warning', label: '冲突', value: SensitiveWordChangeType.Conflict },
];

export const applyStatusOptions = [
  { color: 'warning', label: '待处理', value: SensitiveWordApplyStatus.Pending },
  { color: 'success', label: '已应用', value: SensitiveWordApplyStatus.Applied },
  { color: 'default', label: '已跳过', value: SensitiveWordApplyStatus.Skipped },
  { color: 'error', label: '失败', value: SensitiveWordApplyStatus.Failed },
];

export function useColumns(
  onActionClick: OnActionClickFn<SensitiveWordSyncBatchDto>,
): VxeTableGridColumns<SensitiveWordSyncBatchDto> {
  return [
    { title: '#', type: 'seq', width: 55 },
    {
      field: 'id',
      formatter: ({ cellValue }) => (cellValue ? cellValue.slice(0, 8) : '-'),
      minWidth: 100,
      title: '批次 ID',
    },
    {
      field: 'sourceVersion',
      minWidth: 120,
      title: '版本 / Tag',
    },
    {
      cellRender: { name: 'CellTag', options: batchStatusOptions },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      field: 'totalCount',
      title: '差异总量',
      width: 90,
    },
    {
      field: 'addedCount',
      title: '新增 (+)',
      width: 85,
    },
    {
      field: 'updatedCount',
      title: '变更 (~)',
      width: 85,
    },
    {
      field: 'removedCount',
      title: '移除 (-)',
      width: 85,
    },
    {
      field: 'conflictCount',
      title: '冲突 (!)',
      width: 85,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'warning', label: '需人工审核', value: true },
          { color: 'default', label: '自动就绪', value: false },
        ],
      },
      field: 'requiresReview',
      title: '审核策略',
      width: 110,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      minWidth: 160,
      title: '创建时间',
    },
    {
      cellRender: {
        attrs: {
          nameField: 'id',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'review', text: '差异审查' },
          {
            code: 'apply',
            disabled: (row: SensitiveWordSyncBatchDto) =>
              row.status !== SensitiveWordBatchStatus.PendingReview,
            props: { type: 'primary' },
            text: '应用变更',
          },
          {
            code: 'ignore',
            disabled: (row: SensitiveWordSyncBatchDto) =>
              row.status !== SensitiveWordBatchStatus.PendingReview,
            text: '忽略',
          },
          {
            code: 'supersede',
            disabled: (row: SensitiveWordSyncBatchDto) =>
              row.status !== SensitiveWordBatchStatus.PendingReview,
            props: { danger: true },
            text: '废弃',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 260,
    },
  ];
}
