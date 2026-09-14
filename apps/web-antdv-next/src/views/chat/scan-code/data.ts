import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ScanCodeDto } from '#/api/chat/scan-code';

import { $t } from '#/locales';

export function useColumns(
  onActionClick: OnActionClickFn<ScanCodeDto>,
): VxeTableGridColumns<ScanCodeDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '登录', value: 'Login' },
          { color: 'blue', label: '加好友', value: 'AddFriend' },
          { color: 'purple', label: '加群', value: 'JoinGroup' },
          { color: 'orange', label: '名片', value: 'Card' },
          { color: 'default', label: '其它', value: 'Other' },
        ],
      },
      field: 'type',
      title: '业务类型',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'content',
      minWidth: 200,
      title: '扫描内容 (Raw Content)',
    },
    {
      field: 'deviceId',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '扫码设备 ID',
    },
    {
      field: 'userId',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '扫码用户 ID',
    },
    {
      field: 'handlerCount',
      title: '处理器命中数',
      width: 120,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '扫描时间',
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
        options: [{ code: 'detail', text: '详情与处理日志' }],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 140,
    },
  ];
}
