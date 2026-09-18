import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AiRunDto } from '#/api/chat/ai-run';

import { AiRunStatus } from '#/api/chat/ai-run';
import { $t } from '#/locales';

export const AI_RUN_STATUS_MAP: Record<
  AiRunStatus,
  { color: string; desc: string; label: string }
> = {
  [AiRunStatus.Queued]: {
    color: 'default',
    desc: '任务已创建，进入执行队列',
    label: '排队中',
  },
  [AiRunStatus.Running]: {
    color: 'processing',
    desc: 'AI 工作节点已认领并正在生成',
    label: '执行中',
  },
  [AiRunStatus.Completed]: {
    color: 'success',
    desc: '任务执行完成且已生成回复消息',
    label: '已完成',
  },
  [AiRunStatus.RetryScheduled]: {
    color: 'warning',
    desc: '遭遇临时异常，等待下一次重试',
    label: '等待重试',
  },
  [AiRunStatus.Failed]: {
    color: 'error',
    desc: '重试耗尽或不可恢复错误导致失败',
    label: '执行失败',
  },
  [AiRunStatus.TimedOut]: {
    color: 'error',
    desc: '超过执行期限或心跳超时未响应',
    label: '执行超时',
  },
  [AiRunStatus.Cancelled]: {
    color: 'default',
    desc: '任务已被人工或客户端主动取消',
    label: '已取消',
  },
};

export const statusOptions = [
  { label: '全部状态', value: undefined },
  { label: '排队中 (Queued)', value: AiRunStatus.Queued },
  { label: '执行中 (Running)', value: AiRunStatus.Running },
  { label: '已完成 (Completed)', value: AiRunStatus.Completed },
  { label: '等待重试 (RetryScheduled)', value: AiRunStatus.RetryScheduled },
  { label: '执行失败 (Failed)', value: AiRunStatus.Failed },
  { label: '执行超时 (TimedOut)', value: AiRunStatus.TimedOut },
  { label: '已取消 (Cancelled)', value: AiRunStatus.Cancelled },
];

export function useColumns(
  onActionClick: OnActionClickFn<AiRunDto>,
): VxeTableGridColumns<AiRunDto> {
  return [
    {
      type: 'checkbox',
      width: 45,
    },
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: Object.entries(AI_RUN_STATUS_MAP).map(([key, item]) => ({
          color: item.color,
          label: item.label,
          value: Number(key),
        })),
      },
      field: 'status',
      fixed: 'left',
      title: '任务状态',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'id',
      minWidth: 150,
      title: 'Run ID',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: 'OpenAI', value: 'OpenAI' },
          { color: 'purple', label: 'Claude', value: 'Claude' },
          { color: 'green', label: 'DeepSeek', value: 'DeepSeek' },
          { color: 'orange', label: 'Qwen', value: 'Qwen' },
          { color: 'cyan', label: 'Ollama', value: 'Ollama' },
          { color: 'default', label: 'Gemini', value: 'Gemini' },
        ],
      },
      field: 'provider',
      title: 'AI 驱动 (Provider)',
      width: 130,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'sourceMessageId',
      minWidth: 130,
      title: '源消息 ID',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'outputMessageId',
      formatter: 'formatEmpty',
      minWidth: 130,
      title: '回复消息 ID',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'sessionId',
      formatter: 'formatEmpty',
      minWidth: 150,
      title: '会话 ID (Session)',
    },
    {
      formatter: ({ row }) => `${row.attemptCount} / ${row.maxAttempts}`,
      title: '重试进度',
      width: 95,
    },
    {
      field: 'leaseOwner',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '执行节点 (Lease)',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 165,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'id',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'detail', text: '详情' },
          {
            code: 'retry',
            disabled: (row: AiRunDto) =>
              ![
                AiRunStatus.Failed,
                AiRunStatus.TimedOut,
                AiRunStatus.RetryScheduled,
              ].includes(row.status),
            text: '重试',
          },
          {
            code: 'cancel',
            disabled: (row: AiRunDto) =>
              ![AiRunStatus.Queued, AiRunStatus.Running].includes(row.status),
            text: '取消',
          },
          { code: 'edit', text: '修改' },
          { code: 'delete', danger: true, text: '删除' },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 220,
    },
  ];
}

