import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AuditLogDto } from '#/api/logmanagement';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的审计日志表格列定义
 */
export function useColumns(
  onActionClick: OnActionClickFn<AuditLogDto>,
): VxeTableGridColumns<AuditLogDto> {
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
          { color: 'green', label: '200 OK', value: 200 },
          { color: 'blue', label: '204', value: 204 },
          { color: 'orange', label: '401', value: 401 },
          { color: 'orange', label: '403', value: 403 },
          { color: 'red', label: '404', value: 404 },
          { color: 'red', label: '500 Error', value: 500 },
        ],
      },
      field: 'httpStatusCode',
      title: '状态码',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: 'GET', value: 'GET' },
          { color: 'green', label: 'POST', value: 'POST' },
          { color: 'orange', label: 'PUT', value: 'PUT' },
          { color: 'red', label: 'DELETE', value: 'DELETE' },
        ],
      },
      field: 'httpMethod',
      title: '请求方式',
      width: 90,
    },
    {
      align: 'left',
      field: 'url',
      headerAlign: 'center',
      minWidth: 260,
      title: '请求地址 (URL)',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'clientIpAddress',
      minWidth: 140,
      title: 'IP 地址',
    },
    {
      field: 'userName',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '操作用户',
    },
    {
      field: 'executionDuration',
      formatter: ({ cellValue }) =>
        cellValue !== undefined && cellValue !== null ? `${cellValue} ms` : '-',
      title: '耗时',
      width: 100,
    },
    {
      field: 'executionTime',
      formatter: 'formatDateTime',
      title: '执行时间',
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'url',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [{ code: 'detail', text: $t('common.detail', '详情') }],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 100,
    },
  ];
}
