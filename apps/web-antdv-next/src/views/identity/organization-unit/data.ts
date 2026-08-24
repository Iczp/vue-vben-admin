import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { OrganizationUnitDto } from '#/api/identity';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的 ABP 内置组织机构/部门表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<OrganizationUnitDto>,
): VxeTableGridColumns<OrganizationUnitDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      align: 'left',
      field: 'displayName',
      headerAlign: 'center',
      minWidth: 220,
      title: $t('page.identity.dept.name', '部门 / 机构名称'),
      treeNode: true,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'code',
      minWidth: 140,
      title: $t('page.identity.dept.code', '组织编码'),
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
          nameField: 'displayName',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'add-child', text: $t('page.identity.dept.addChild', '添加子部门') },
          { code: 'permission', text: $t('page.permission.title', '权限') },
          { code: 'edit', text: $t('common.edit', '编辑') },
          { code: 'delete', text: $t('common.delete', '删除') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 260,
    },
  ];
}
