import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ApplicationDto } from '#/api/openiddict';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的 OpenIddict 客户端应用表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<ApplicationDto>,
): VxeTableGridColumns<ApplicationDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'clientId',
      minWidth: 160,
      title: $t('page.openiddict.clientId', '客户端 ID (ClientId)'),
    },
    {
      field: 'displayName',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: $t('page.openiddict.displayName', '应用显示名称'),
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '机密 (Confidential)', value: 'confidential' },
          { color: 'orange', label: '公共 (Public)', value: 'public' },
        ],
      },
      field: 'clientType',
      title: $t('page.openiddict.clientType', '客户端类型'),
      width: 140,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '明确同意 (Explicit)', value: 'explicit' },
          { color: 'purple', label: '隐式同意 (Implicit)', value: 'implicit' },
          { color: 'cyan', label: '系统默认 (Systematic)', value: 'systematic' },
        ],
      },
      field: 'consentType',
      title: $t('page.openiddict.consentType', '授权许可类型'),
      width: 150,
    },
    {
      field: 'grantTypes',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join(', ')
          : '-',
      minWidth: 180,
      title: '授权模式 (Grant Types)',
    },
    {
      field: 'redirectUris',
      formatter: ({ cellValue }) =>
        Array.isArray(cellValue) && cellValue.length > 0
          ? cellValue.join(', ')
          : '-',
      minWidth: 200,
      title: $t('page.openiddict.redirectUris', '回调地址'),
    },
    {
      cellRender: {
        attrs: {
          nameField: 'clientId',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: $t('common.edit', '编辑') },
          { code: 'set-secret', text: '修改密钥' },
          { code: 'delete', text: $t('common.delete', '删除') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 200,
    },
  ];
}
