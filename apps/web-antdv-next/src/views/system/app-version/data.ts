import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AppVersionDto } from '#/api/app-version';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的 App 版本发布表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<AppVersionDto>,
): VxeTableGridColumns<AppVersionDto> {
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
      title: '目标平台',
      width: 110,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'version',
      title: '版本号',
      width: 110,
    },
    {
      field: 'versionCode',
      title: '版本编码',
      width: 100,
    },
    {
      align: 'left',
      field: 'title',
      headerAlign: 'center',
      minWidth: 180,
      title: '更新标题',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'red', label: '强制升级', value: true },
          { color: 'default', label: '普通升级', value: false },
        ],
      },
      field: 'isForce',
      title: '强制更新',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '已启用', value: true },
          { color: 'red', label: '已停用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 90,
    },
    {
      field: 'issueDate',
      formatter: 'formatDate',
      title: '发布日期',
      width: 120,
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
      width: 140,
    },
  ];
}
