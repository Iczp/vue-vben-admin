import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SecurityReportDto } from '#/api/chat/security';

import { h } from 'vue';

import { Tag } from 'antdv-next';

import { SecurityReportStatus } from '#/api/chat/security';
import { $t } from '#/locales';

export const REPORT_STATUS_OPTIONS = [
  { label: '全部状态', value: undefined },
  { label: '待审核', value: SecurityReportStatus.Pending },
  { label: '已核实处置', value: SecurityReportStatus.Resolved },
  { label: '已驳回忽略', value: SecurityReportStatus.Rejected },
];

export function getReportStatusTag(status: SecurityReportStatus) {
  switch (status) {
    case SecurityReportStatus.Pending: {
      return h(Tag, { color: 'processing' }, () => '待审核');
    }
    case SecurityReportStatus.Rejected: {
      return h(Tag, { color: 'default' }, () => '已驳回/忽略');
    }
    case SecurityReportStatus.Resolved: {
      return h(Tag, { color: 'success' }, () => '已核实处置');
    }
    default: {
      return h(Tag, {}, () => '未知');
    }
  }
}

export function useColumns(
  onActionClick: OnActionClickFn<SecurityReportDto>,
): VxeTableGridColumns<SecurityReportDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'targetContent',
      minWidth: 220,
      title: '举报违规内容 / URL',
    },
    {
      field: 'targetType',
      formatter: 'formatEmpty',
      title: '目标类型',
      width: 100,
    },
    {
      field: 'reason',
      formatter: 'formatEmpty',
      minWidth: 140,
      title: '举报原因 / 类型',
    },
    {
      field: 'status',
      slots: {
        default: ({ row }) => getReportStatusTag(row.status),
      },
      title: '审核状态',
      width: 110,
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '补充描述',
    },
    {
      field: 'auditRemark',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '审核处理说明',
    },
    {
      field: 'reporterSessionUnitId',
      formatter: 'formatEmpty',
      title: '举报人 ID',
      width: 130,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '举报时间',
      width: 165,
    },
    {
      field: 'handledTime',
      formatter: 'formatDateTime',
      title: '处理时间',
      width: 165,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'targetContent',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [{ code: 'audit', text: '审核处置' }],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 110,
    },
  ];
}
