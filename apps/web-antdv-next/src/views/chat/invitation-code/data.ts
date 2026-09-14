import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { InvitationCodeDto } from '#/api/chat/invitation-code';

import { $t } from '#/locales';

export function useColumns(
  onActionClick: OnActionClickFn<InvitationCodeDto>,
): VxeTableGridColumns<InvitationCodeDto> {
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
      field: 'id',
      minWidth: 180,
      title: '邀请码 / ID',
    },
    {
      field: 'title',
      minWidth: 160,
      title: '邀请码标题/用途',
    },
    {
      field: 'ownerId',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '所属对象 / 拥有者 ID',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'title',
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
      width: 130,
    },
  ];
}
