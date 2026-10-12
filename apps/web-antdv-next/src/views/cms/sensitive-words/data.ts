import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SensitiveWordDto } from '#/api/cms';

import {
  ModerationScene,
  SensitiveRiskLevel,
  SensitiveWordAction,
  SensitiveWordCategories,
} from '#/api/cms';

export const categoryOptions = [
  { label: '政治敏感 (Political)', value: SensitiveWordCategories.Political },
  { label: '暴恐违禁 (Violence)', value: SensitiveWordCategories.Violence },
  { label: '色情低俗 (Sexual)', value: SensitiveWordCategories.Sexual },
  { label: '辱骂侮辱 (Abuse)', value: SensitiveWordCategories.Abuse },
  { label: '诈骗欺诈 (Fraud)', value: SensitiveWordCategories.Fraud },
  { label: '垃圾广告 (Advertisement)', value: SensitiveWordCategories.Advertisement },
  { label: '违规导流 (ContactInfo)', value: SensitiveWordCategories.ContactInfo },
  { label: '违法违禁 (Illegal)', value: SensitiveWordCategories.Illegal },
  { label: '自定义业务词 (Custom)', value: SensitiveWordCategories.Custom },
];

export const riskLevelOptions = [
  { color: 'error', label: '高风险 (High)', value: SensitiveRiskLevel.High },
  { color: 'warning', label: '中风险 (Medium)', value: SensitiveRiskLevel.Medium },
  { color: 'processing', label: '低风险 (Low)', value: SensitiveRiskLevel.Low },
];

export const actionOptions = [
  { color: 'error', label: '拦截拒绝 (Reject)', value: SensitiveWordAction.Reject },
  { color: 'warning', label: '人工审核 (Review)', value: SensitiveWordAction.Review },
  { color: 'success', label: '放行通过 (Pass)', value: SensitiveWordAction.Pass },
];

export const sceneOptions = [
  { label: '全局通用 (All)', value: ModerationScene.General },
  { label: '文章起草 (ContentCreate)', value: ModerationScene.ContentCreate },
  { label: '文章发布 (ContentPublish)', value: ModerationScene.ContentPublish },
  { label: '发表评论 (CommentCreate)', value: ModerationScene.CommentCreate },
  { label: '素材媒体 (MediaMetadata)', value: ModerationScene.MediaMetadata },
  { label: '用户资料 (ActorProfile)', value: ModerationScene.ActorProfile },
  { label: '搜索查询 (SearchQuery)', value: ModerationScene.SearchQuery },
];

export function useColumns(
  onActionClick: OnActionClickFn<SensitiveWordDto>,
): VxeTableGridColumns<SensitiveWordDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'word',
      minWidth: 160,
      title: '敏感词原词',
    },
    {
      field: 'category',
      minWidth: 130,
      title: '风险分类',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: riskLevelOptions,
      },
      field: 'riskLevel',
      title: '风险等级',
      width: 140,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: actionOptions,
      },
      field: 'action',
      title: '处置动作',
      width: 140,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          ...sceneOptions,
          { color: 'default', label: '全局通用', value: undefined as any },
        ],
      },
      field: 'scene',
      title: '生效场景',
      width: 150,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'purple', label: '正则', value: true },
          { color: 'default', label: '普通', value: false },
        ],
      },
      field: 'isRegex',
      title: '类型',
      width: 80,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'orange', label: '锁定保护', value: true },
          { color: 'default', label: '未锁定', value: false },
        ],
      },
      field: 'isLocked',
      title: '锁定保护',
      width: 95,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'default', label: '禁用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 85,
    },
    {
      field: 'remark',
      formatter: 'formatEmpty',
      minWidth: 150,
      showOverflow: 'ellipsis',
      title: '备注说明',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'word',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'toggle', text: (row: SensitiveWordDto) => (row.isEnabled ? '禁用' : '启用') },
          { code: 'edit', text: '编辑' },
          {
            code: 'delete',
            props: { danger: true },
            text: '删除',
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
