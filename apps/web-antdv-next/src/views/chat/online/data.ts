import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ConnectionPoolDto, LastOnlineDto, OnlineHostDto } from '#/api/chat';

/**
 * 1. 在线连接池表格列定义 (ConnectionPoolDto)
 */
export function useConnectionColumns(
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
      field: 'chatObjectIdList',
      formatter: ({ cellValue }) => {
        if (!cellValue || !Array.isArray(cellValue) || cellValue.length === 0) {
          return '-';
        }
        return `已绑定 ${cellValue.length} 个`;
      },
      minWidth: 110,
      title: '绑定聊天对象',
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
      minWidth: 100,
      title: '设备类型',
    },
    {
      field: 'browser',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '浏览器 / Client',
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
      minWidth: 130,
      title: '宿主节点 (Host)',
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
          { code: 'detail', text: '详情' },
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
      width: 140,
    },
  ];
}

/**
 * 2. 主机节点表格列定义 (OnlineHostDto)
 */
export function useHostColumns(
  onActionClick: OnActionClickFn<OnlineHostDto>,
): VxeTableGridColumns<OnlineHostDto> {
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
      field: 'host',
      minWidth: 200,
      title: '主机节点名称 (Host)',
    },
    {
      field: 'count',
      minWidth: 140,
      title: '当前在线连接数',
    },
    {
      field: 'startTime',
      formatter: 'formatDateTime',
      minWidth: 180,
      title: '节点启动时间',
    },
    {
      cellRender: {
        attrs: {
          nameField: 'host',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'view-connections', text: '查看连接' },
          {
            code: 'clear-host',
            props: {
              danger: true,
            },
            text: '清空连接',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 170,
    },
  ];
}

/**
 * 3. 最近在线记录表格列定义 (LastOnlineDto)
 */
export function useLastOnlineColumns(): VxeTableGridColumns<LastOnlineDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'deviceId',
      minWidth: 180,
      title: '设备 ID',
    },
    {
      field: 'deviceType',
      minWidth: 120,
      title: '设备类型',
    },
    {
      field: 'activeTime',
      formatter: 'formatDateTime',
      minWidth: 180,
      title: '最后在线时间',
    },
  ];
}
