import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SensitiveWordSourceDto } from '#/api/cms';

import {
  SensitiveWordSourceStatus,
  SensitiveWordSourceType,
  SensitiveWordSyncMode,
} from '#/api/cms';

export const sourceTypeOptions = [
  { color: 'blue', label: 'Git 仓库', value: SensitiveWordSourceType.Git },
  {
    color: 'green',
    label: 'HTTP(S) 接口/文件',
    value: SensitiveWordSourceType.Http,
  },
  {
    color: 'orange',
    label: '本地文件目录',
    value: SensitiveWordSourceType.LocalFile,
  },
];

export const syncModeOptions = [
  {
    color: 'default',
    label: '纯手工 (Manual)',
    value: SensitiveWordSyncMode.Manual,
  },
  {
    color: 'warning',
    label: '审核后应用 (Review)',
    value: SensitiveWordSyncMode.ReviewBeforeApply,
  },
  {
    color: 'purple',
    label: '自动同步应用 (Auto)',
    value: SensitiveWordSyncMode.Automatic,
  },
];

export const statusOptions = [
  {
    color: 'default',
    label: '空闲就绪',
    value: SensitiveWordSourceStatus.Idle,
  },
  {
    color: 'processing',
    label: '检查中',
    value: SensitiveWordSourceStatus.Checking,
  },
  {
    color: 'warning',
    label: '同步中',
    value: SensitiveWordSourceStatus.Syncing,
  },
  { color: 'error', label: '异常', value: SensitiveWordSourceStatus.Error },
];

export function useColumns(
  onActionClick: OnActionClickFn<SensitiveWordSourceDto>,
): VxeTableGridColumns<SensitiveWordSourceDto> {
  return [
    { title: '#', type: 'seq', width: 55 },
    { field: 'code', minWidth: 140, title: '数据源编码' },
    { field: 'name', minWidth: 160, title: '数据源名称' },
    {
      cellRender: { name: 'CellTag', options: sourceTypeOptions },
      field: 'sourceType',
      title: '类型',
      width: 120,
    },
    {
      field: 'sourceUri',
      minWidth: 200,
      showOverflow: 'ellipsis',
      title: '源地址',
    },
    { field: 'branch', title: '分支', width: 100, formatter: 'formatEmpty' },
    { field: 'priority', title: '优先级', width: 80 },
    {
      cellRender: { name: 'CellTag', options: syncModeOptions },
      field: 'syncMode',
      title: '同步模式',
      width: 170,
    },
    {
      cellRender: { name: 'CellTag', options: statusOptions },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      field: 'lastCheckedVersion',
      title: '最新版本',
      width: 110,
      formatter: 'formatEmpty',
    },
    {
      field: 'lastCheckTime',
      formatter: 'formatDateTime',
      title: '上次检查',
      width: 160,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'default', label: '禁用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '启停',
      width: 80,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'check', text: '检查更新' },
          { code: 'sync', text: '同步' },
          { code: 'snapshots', text: '快照' },
          { code: 'edit', text: '编辑' },
          {
            code: 'toggle',
            text: (row: SensitiveWordSourceDto) =>
              row.isEnabled ? '禁用' : '启用',
          },
          { code: 'delete', props: { danger: true }, text: '删除' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 280,
    },
  ];
}
