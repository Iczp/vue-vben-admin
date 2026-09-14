import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ConnectionPoolDto } from '#/api/chat';

/**
 * 在线连接池表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<ConnectionPoolDto>,
): VxeTableGridColumns<ConnectionPoolDto> {
  return [
    {
      type: 'checkbox',
      width: 50,
    },
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'connectionId',
      minWidth: 190,
      title: '连接 ID (ConnectionId)',
    },
    {
      field: 'userName',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '用户名 / 账号',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: 'Android', value: 'android' },
          { color: 'blue', label: 'iOS', value: 'ios' },
          { color: 'purple', label: 'Windows', value: 'windows' },
          { color: 'cyan', label: 'macOS', value: 'macos' },
          { color: 'default', label: 'Web', value: 'web' },
        ],
      },
      field: 'platform',
      title: '平台',
      width: 100,
    },
    {
      field: 'deviceType',
      formatter: 'formatEmpty',
      minWidth: 110,
      title: '设备类型',
    },
    {
      field: 'browser',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '客户端 / 浏览器',
    },
    {
      field: 'ipAddress',
      formatter: 'formatEmpty',
      minWidth: 130,
      title: 'IP 地址',
    },
    {
      field: 'host',
      formatter: 'formatEmpty',
      minWidth: 140,
      title: '连接宿主 (Host)',
    },
    {
      field: 'activeTime',
      formatter: 'formatDateTime',
      minWidth: 165,
      title: '最后心跳时间',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      minWidth: 165,
      title: '连接建立时间',
    },
    {
      cellRender: {
        attrs: {
          nameField: 'connectionId',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'abort',
            props: {
              danger: true,
            },
            text: '强制断开',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 110,
    },
  ];
}
