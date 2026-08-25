import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AuthorizationDto } from '#/api/openiddict';

import { $t } from '#/locales';

/**
 * OpenIddict 授权记录表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<AuthorizationDto>,
): VxeTableGridColumns<AuthorizationDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: 'valid', value: 'valid' },
          { color: 'red', label: 'revoked', value: 'revoked' },
        ],
      },
      field: 'status',
      title: '状态',
      width: 100,
    },
    {
      field: 'type',
      title: '授权类别',
      width: 120,
    },
    {
      field: 'subject',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '授权主体 (Subject / UserId)',
    },
    {
      field: 'scopes',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join(', ')
          : '-',
      minWidth: 180,
      title: '授权作用域 (Scopes)',
    },
    {
      field: 'creationDate',
      formatter: 'formatDateTime',
      title: '授权创建时间',
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'id',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [{ code: 'delete', text: '撤销授权' }],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 110,
    },
  ];
}
