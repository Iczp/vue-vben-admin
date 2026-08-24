import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ApplicationDto } from '#/api/openiddict';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的表格列定义
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
      field: 'clientId',
      minWidth: 150,
      title: $t('page.openiddict.clientId', '客户端 ID (ClientId)'),
    },
    {
      field: 'displayName',
      minWidth: 140,
      title: $t('page.openiddict.displayName', '应用显示名称'),
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: 'confidential', value: 'confidential' },
          { color: 'orange', label: 'public', value: 'public' },
        ],
      },
      field: 'clientType',
      title: $t('page.openiddict.clientType', '客户端类型'),
      width: 130,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: 'explicit', value: 'explicit' },
          { color: 'purple', label: 'implicit', value: 'implicit' },
          { color: 'cyan', label: 'systematic', value: 'systematic' },
        ],
      },
      field: 'consentType',
      title: $t('page.openiddict.consentType', '授权确认类型'),
      width: 140,
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
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 140,
    },
  ];
}
