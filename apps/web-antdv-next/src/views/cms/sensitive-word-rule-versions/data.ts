import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SensitiveWordRuleVersionDto } from '#/api/cms';

import {
  SensitiveWordActivationAction,
  SensitiveWordRuleVersionStatus,
} from '#/api/cms';

export const versionStatusOptions = [
  { color: 'default', label: '草稿 (Draft)', value: SensitiveWordRuleVersionStatus.Draft },
  { color: 'processing', label: '已就绪 (Ready)', value: SensitiveWordRuleVersionStatus.Ready },
  { color: 'success', label: '生效中 (Active)', value: SensitiveWordRuleVersionStatus.Active },
  { color: 'default', label: '已归档 (Archived)', value: SensitiveWordRuleVersionStatus.Archived },
];

export const activationActionOptions = [
  { color: 'default', label: '初始就绪', value: SensitiveWordActivationAction.Initial },
  { color: 'success', label: '新版本发布', value: SensitiveWordActivationAction.Publish },
  { color: 'warning', label: '版本回滚', value: SensitiveWordActivationAction.Rollback },
];

export function useColumns(
  onActionClick: OnActionClickFn<SensitiveWordRuleVersionDto>,
): VxeTableGridColumns<SensitiveWordRuleVersionDto> {
  return [
    { title: '#', type: 'seq', width: 55 },
    {
      field: 'version',
      formatter: ({ cellValue }) => `v${cellValue}`,
      minWidth: 100,
      title: '版本号',
    },
    {
      cellRender: { name: 'CellTag', options: versionStatusOptions },
      field: 'status',
      title: '状态',
      width: 130,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '当前生效', value: true },
          { color: 'default', label: '历史版本', value: false },
        ],
      },
      field: 'isActive',
      title: '运行时',
      width: 100,
    },
    {
      field: 'wordCount',
      title: '词条数',
      width: 95,
    },
    {
      field: 'whitelistCount',
      title: '白名单数',
      width: 95,
    },
    {
      field: 'contentHash',
      formatter: ({ cellValue }) => (cellValue ? `${cellValue.slice(0, 12)}...` : '-'),
      minWidth: 140,
      title: '规则集 Hash',
    },
    {
      field: 'firstPublishedTime',
      formatter: 'formatDateTime',
      minWidth: 160,
      title: '发布时间',
    },
    {
      field: 'remark',
      minWidth: 160,
      showOverflow: 'ellipsis',
      title: '版本说明',
    },
    {
      cellRender: {
        attrs: {
          nameField: 'version',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'rollback',
            disabled: (row: SensitiveWordRuleVersionDto) => row.isActive,
            props: { danger: true },
            text: '回滚到该版本',
          },
          { code: 'detail', text: '详情' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 170,
    },
  ];
}
