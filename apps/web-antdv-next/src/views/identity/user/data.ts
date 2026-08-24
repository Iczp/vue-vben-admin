import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { IdentityUserDto } from '#/api/identity';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的表格列定义 (支持 formatter, cellRender, slots 等丰富特性)
 */
export function useColumns(
  onActionClick: OnActionClickFn<IdentityUserDto>,
): VxeTableGridColumns<IdentityUserDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'userName',
      minWidth: 130,
      title: $t('page.identity.user.userName', '用户名'),
    },
    {
      field: 'name',
      minWidth: 100,
      title: $t('page.identity.user.name', '姓名'),
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'email',
      minWidth: 180,
      title: $t('page.identity.user.email', '邮箱'),
    },
    {
      field: 'phoneNumber',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: $t('page.identity.user.phoneNumber', '手机号'),
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: $t('common.enabled', '启用'), value: true },
          { color: 'error', label: $t('common.disabled', '禁用'), value: false },
        ],
      },
      field: 'isActive',
      title: $t('page.identity.user.status', '状态'),
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'warning', label: $t('common.enabled', '开启'), value: true },
          { color: 'default', label: $t('common.disabled', '关闭'), value: false },
        ],
      },
      field: 'lockoutEnabled',
      title: $t('page.identity.user.lockout', '锁定保护'),
      width: 110,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: $t('common.creationTime', '创建时间'),
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'userName',
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
