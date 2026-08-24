import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { IdentityRoleDto } from '#/api/identity';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<IdentityRoleDto>,
): VxeTableGridColumns<IdentityRoleDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'name',
      minWidth: 150,
      title: $t('page.identity.role.name', '角色名称'),
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.yes', '是'), value: true },
          { color: 'default', label: $t('common.no', '否'), value: false },
        ],
      },
      field: 'isDefault',
      title: $t('page.identity.role.isDefault', '默认角色'),
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'processing', label: $t('common.yes', '是'), value: true },
          { color: 'default', label: $t('common.no', '否'), value: false },
        ],
      },
      field: 'isPublic',
      title: $t('page.identity.role.isPublic', '公共角色'),
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'warning', label: $t('page.identity.role.static', '系统静态'), value: true },
          { color: 'cyan', label: $t('page.identity.role.custom', '自定义'), value: false },
        ],
      },
      field: 'isStatic',
      title: $t('page.identity.role.type', '类型'),
      width: 110,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: ['edit', 'permission', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 180,
    },
  ];
}
