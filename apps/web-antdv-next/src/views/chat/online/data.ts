import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type {
  ConnectionPoolDto,
  LastOnlineDto,
  OnlineHostDto,
} from '#/api/chat';

import { h } from 'vue';

import { message, Popover, Tag, Tooltip } from 'antdv-next';

import { copyToClipboard } from '#/utils/clipboard';

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
      minWidth: 180,
      title: '连接 ID (ConnectionId)',
    },
    {
      field: 'userName',
      minWidth: 140,
      title: '用户 / 账号',
      slots: {
        default: ({ row }) => {
          const userName = row.userName || '-';
          const userId = row.userId;
          return h(
            'div',
            {
              class: 'flex flex-col items-start leading-tight py-0.5 text-left',
            },
            [
              h(
                'span',
                {
                  class:
                    'font-semibold text-foreground text-xs truncate max-w-[130px]',
                  title: userName,
                },
                userName,
              ),
              userId
                ? h(
                    Tooltip,
                    { title: `用户 GUID: ${userId} (点击复制)` },
                    {
                      default: () =>
                        h(
                          'span',
                          {
                            class:
                              'text-[10px] text-muted-foreground font-mono truncate max-w-[130px] cursor-pointer hover:text-primary transition-colors',
                            onClick: async (e: MouseEvent) => {
                              e.stopPropagation();
                              await copyToClipboard(userId);
                              message.success('已复制用户 ID');
                            },
                          },
                          userId,
                        ),
                    },
                  )
                : null,
            ],
          );
        },
      },
    },
    {
      field: 'chatObjectIdList',
      minWidth: 160,
      title: '绑定聊天对象',
      slots: {
        default: ({ row }) => {
          const list: number[] = row.chatObjectIdList || [];
          if (!list || list.length === 0) {
            return h('span', { class: 'text-muted-foreground text-xs' }, '-');
          }

          // 气泡内渲染所有聊天对象 ID
          const renderAllTags = () =>
            h('div', { class: 'max-w-[280px] p-1 text-left' }, [
              h(
                'div',
                { class: 'text-xs font-semibold mb-2 text-foreground' },
                `已绑定聊天对象 (${list.length} 个)`,
              ),
              h(
                'div',
                { class: 'flex flex-wrap gap-1 max-h-[200px] overflow-y-auto' },
                list.map((id) =>
                  h(
                    Tag,
                    {
                      color: 'blue',
                      class:
                        'cursor-pointer hover:opacity-80 transition-opacity mr-0 text-[11px]',
                      onClick: async (e: MouseEvent) => {
                        e.stopPropagation();
                        await copyToClipboard(String(id));
                        message.success(`已复制聊天对象 ID: ${id}`);
                      },
                    },
                    { default: () => `#${id}` },
                  ),
                ),
              ),
            ]);

          if (list.length <= 2) {
            return h(
              'div',
              { class: 'flex flex-wrap gap-1 items-center justify-center' },
              list.map((id) =>
                h(
                  Tag,
                  { color: 'blue', class: 'mr-0 text-[11px]' },
                  { default: () => `#${id}` },
                ),
              ),
            );
          }

          const visible = list.slice(0, 2);
          const remainingCount = list.length - 2;

          return h(
            'div',
            { class: 'flex items-center justify-center gap-1 flex-wrap' },
            [
              ...visible.map((id) =>
                h(
                  Tag,
                  { color: 'blue', class: 'mr-0 text-[11px]' },
                  { default: () => `#${id}` },
                ),
              ),
              h(
                Popover,
                { trigger: 'hover', placement: 'top' },
                {
                  content: renderAllTags,
                  default: () =>
                    h(
                      Tag,
                      {
                        color: 'cyan',
                        class: 'mr-0 text-[11px] cursor-pointer font-medium',
                      },
                      { default: () => `+${remainingCount}` },
                    ),
                },
              ),
            ],
          );
        },
      },
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: 'Android', value: 'android' },
          { color: 'blue', label: 'iOS', value: 'ios' },
          { color: 'purple', label: 'Windows', value: 'windows' },
          { color: 'cyan', label: 'macOS', value: 'macos' },
          { color: 'orange', label: 'Linux', value: 'linux' },
          { color: 'default', label: 'Web', value: 'web' },
        ],
      },
      field: 'platform',
      title: '平台',
      width: 95,
    },
    {
      field: 'brand',
      minWidth: 160,
      title: '设备品牌 / 型号',
      slots: {
        default: ({ row }) => {
          const brandModel = [row.brand, row.model].filter(Boolean).join(' ');
          const deviceTitle =
            brandModel || row.deviceInfo || row.deviceType || '-';
          const deviceId = row.deviceId;

          return h(
            'div',
            {
              class: 'flex flex-col items-start leading-tight py-0.5 text-left',
            },
            [
              h(
                'span',
                {
                  class:
                    'font-medium text-foreground text-xs truncate max-w-[150px]',
                  title: deviceTitle,
                },
                deviceTitle,
              ),
              deviceId
                ? h(
                    Tooltip,
                    {
                      title: () =>
                        h('div', { class: 'text-xs text-left' }, [
                          h('div', `设备ID: ${deviceId} (点击复制)`),
                          row.deviceType
                            ? h('div', `设备类型: ${row.deviceType}`)
                            : null,
                          row.deviceInfo
                            ? h('div', `设备信息: ${row.deviceInfo}`)
                            : null,
                        ]),
                    },
                    {
                      default: () =>
                        h(
                          'span',
                          {
                            class:
                              'text-[10px] text-muted-foreground font-mono truncate max-w-[130px] cursor-pointer hover:text-primary transition-colors',
                            onClick: async (e: MouseEvent) => {
                              e.stopPropagation();
                              await copyToClipboard(deviceId);
                              message.success('已复制设备唯一标识 (DeviceId)');
                            },
                          },
                          deviceId,
                        ),
                    },
                  )
                : null,
            ],
          );
        },
      },
    },
    {
      field: 'appName',
      minWidth: 150,
      title: '应用 / 客户端',
      slots: {
        default: ({ row }) => {
          const appTitle =
            row.appName || row.browser || row.clientName || row.clientId || '-';
          const clientTag = row.clientId || row.appId;
          const tooltipContent = () =>
            h('div', { class: 'text-xs text-left' }, [
              row.appName ? h('div', `应用名称: ${row.appName}`) : null,
              row.appId ? h('div', `应用 ID: ${row.appId}`) : null,
              row.clientId ? h('div', `客户端 ID: ${row.clientId}`) : null,
              row.clientName ? h('div', `客户端名称: ${row.clientName}`) : null,
              row.browser ? h('div', `浏览器: ${row.browser}`) : null,
              row.browserInfo ? h('div', `环境信息: ${row.browserInfo}`) : null,
            ]);

          return h(
            Tooltip,
            {},
            {
              title: tooltipContent,
              default: () =>
                h(
                  'div',
                  {
                    class:
                      'flex flex-col items-start leading-tight py-0.5 text-left',
                  },
                  [
                    h(
                      'span',
                      {
                        class:
                          'font-medium text-foreground text-xs truncate max-w-[140px]',
                      },
                      appTitle,
                    ),
                    clientTag
                      ? h(
                          Tag,
                          {
                            color: 'geekblue',
                            class:
                              'mr-0 mt-0.5 text-[10px] px-1 py-0 leading-tight scale-90 origin-left',
                          },
                          { default: () => clientTag },
                        )
                      : null,
                  ],
                ),
            },
          );
        },
      },
    },
    {
      field: 'ipAddress',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: 'IP 地址',
    },
    {
      field: 'host',
      formatter: 'formatEmpty',
      minWidth: 120,
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
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'deviceId',
      minWidth: 200,
      title: '设备唯一 ID (DeviceId)',
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
