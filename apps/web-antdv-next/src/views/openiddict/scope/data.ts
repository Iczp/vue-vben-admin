import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ScopeDto } from '#/api/openiddict';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的 OpenIddict Scope 表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<ScopeDto>,
): VxeTableGridColumns<ScopeDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'name',
      minWidth: 160,
      title: '作用域名称 (Name)',
    },
    {
      field: 'displayName',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '显示名称 (Display Name)',
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 200,
      title: '描述',
    },
    {
      field: 'resources',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join(', ')
          : '-',
      minWidth: 160,
      title: '目标资源 (Resources)',
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
          { code: 'edit', text: $t('common.edit', '编辑') },
          { code: 'delete', text: $t('common.delete', '删除') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 140,
    },
  ];
}
