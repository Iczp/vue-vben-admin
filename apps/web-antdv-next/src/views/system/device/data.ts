import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { DeviceDto } from '#/api/device';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的设备监控表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<DeviceDto>,
): VxeTableGridColumns<DeviceDto> {
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
          { color: 'green', label: 'Android', value: 'android' },
          { color: 'blue', label: 'iOS', value: 'ios' },
          { color: 'purple', label: 'Windows', value: 'windows' },
          { color: 'cyan', label: 'macOS', value: 'macos' },
          { color: 'default', label: 'Web/H5', value: 'web' },
        ],
      },
      field: 'platform',
      title: '系统平台',
      width: 100,
    },
    {
      field: 'name',
      formatter: 'formatEmpty',
      minWidth: 140,
      title: '设备备注',
    },
    {
      field: 'brand',
      formatter: 'formatEmpty',
      minWidth: 100,
      title: '品牌',
    },
    {
      field: 'model',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '型号',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'deviceId',
      minWidth: 200,
      title: '设备 UUID / ID',
    },
    {
      field: 'userName',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '登录账号',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '允许登录', value: true },
          { color: 'red', label: '已禁止', value: false },
        ],
      },
      field: 'isEnabled',
      title: '授权状态',
      width: 100,
    },
    {
      field: 'lastActiveTime',
      formatter: 'formatDateTime',
      title: '最后活跃时间',
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'deviceId',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: $t('common.edit', '编辑') },
          { code: 'delete', text: '强制下线' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 140,
    },
  ];
}
