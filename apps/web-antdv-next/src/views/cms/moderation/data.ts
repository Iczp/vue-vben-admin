import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ContentModerationDto } from '#/api/cms';

import {
  ContentModerationStatus,
  ContentRiskLevel,
  ModerationDecision,
} from '#/api/cms';

export const moderationStatusOptions = [
  { color: 'default', label: '待处理', value: ContentModerationStatus.Pending },
  { color: 'processing', label: '审核中', value: ContentModerationStatus.Processing },
  { color: 'success', label: '合规通过', value: ContentModerationStatus.Approved },
  { color: 'error', label: '违规拦截', value: ContentModerationStatus.Rejected },
  { color: 'warning', label: '需人工审核', value: ContentModerationStatus.NeedManualReview },
];

export const riskLevelOptions = [
  { color: 'success', label: '无风险 (Pass)', value: ContentRiskLevel.Pass },
  { color: 'blue', label: '低风险 (Low)', value: ContentRiskLevel.Low },
  { color: 'orange', label: '中风险 (Medium)', value: ContentRiskLevel.Medium },
  { color: 'red', label: '高风险 (High)', value: ContentRiskLevel.High },
];

export const decisionOptions = [
  { color: 'success', label: '建议通过', value: ModerationDecision.Approve },
  { color: 'error', label: '建议拒绝', value: ModerationDecision.Reject },
  { color: 'warning', label: '转人工复核', value: ModerationDecision.ManualReview },
];

export function useColumns(
  onActionClick: OnActionClickFn<ContentModerationDto>,
): VxeTableGridColumns<ContentModerationDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'entityType',
      title: '审核实体',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'entityId',
      title: '实体 ID',
      width: 150,
    },
    {
      field: 'provider',
      title: '审核引擎',
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: moderationStatusOptions,
      },
      field: 'status',
      title: '审核状态',
      width: 110,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: riskLevelOptions,
      },
      field: 'riskLevel',
      title: '风险等级',
      width: 120,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: decisionOptions,
      },
      field: 'decision',
      title: '系统决策',
      width: 110,
    },
    {
      field: 'suggestion',
      formatter: 'formatEmpty',
      minWidth: 180,
      showOverflow: 'tooltip',
      title: '审核处置建议',
    },
    {
      field: 'completedTime',
      formatter: 'formatDateTime',
      title: '审核完成时间',
      width: 160,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'entityId',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'detail', text: '详情' },
          {
            code: 'review',
            props: { type: 'link' },
            text: '人工裁决',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 150,
    },
  ];
}
