import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { TenantDto } from '#/api/multi-tenancy';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<TenantDto>,
): VxeTableGridColumns<TenantDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'name',
      minWidth: 160,
      title: $t('page.tenant.name', '租户名称'),
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'id',
      minWidth: 260,
      title: $t('page.tenant.id', '租户标识 (Tenant ID)'),
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
          {
            code: 'features',
            text: $t('page.tenant.features', '功能特性'),
          },
          {
            code: 'connection-string',
            text: $t('page.tenant.connectionString', '数据库连接'),
          },
          { code: 'permission', text: $t('page.permission.title', '权限') },
          { code: 'delete', text: $t('common.delete', '删除') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 300,
    },
  ];
}
