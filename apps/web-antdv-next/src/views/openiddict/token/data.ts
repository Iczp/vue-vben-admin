import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { TokenDto } from '#/api/openiddict';

import { $t } from '#/locales';

/**
 * OpenIddict 令牌管理表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<TokenDto>,
): VxeTableGridColumns<TokenDto> {
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
          { color: 'orange', label: 'expired', value: 'expired' },
        ],
      },
      field: 'status',
      title: '状态',
      width: 95,
    },
    {
      field: 'type',
      title: '令牌类别',
      width: 130,
    },
    {
      field: 'subject',
      formatter: 'formatEmpty',
      minWidth: 150,
      title: '主体 (Subject / UserId)',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'referenceId',
      minWidth: 160,
      title: '引用标识 (Reference ID)',
    },
    {
      field: 'creationDate',
      formatter: 'formatDateTime',
      title: '签发时间',
      width: 170,
    },
    {
      field: 'expirationDate',
      formatter: 'formatDateTime',
      title: '过期时间',
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
        options: [{ code: 'delete', text: '撤销令牌' }],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 110,
    },
  ];
}
