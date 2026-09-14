import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { MessageReportDto, MessageSummaryDto } from '#/api/chat/message-report';

/**
 * 报表明细表格列
 */
export function useReportColumns(): VxeTableGridColumns<MessageReportDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'dateBucket',
      minWidth: 150,
      title: '时间桶 (DateBucket)',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '文本', value: 0 },
          { color: 'green', label: '图片', value: 1 },
          { color: 'purple', label: '语音', value: 2 },
          { color: 'orange', label: '视频', value: 3 },
          { color: 'cyan', label: '文件', value: 4 },
          { color: 'pink', label: '位置', value: 5 },
          { color: 'red', label: '红包/转账', value: 6 },
          { color: 'default', label: '系统通知', value: 10 },
        ],
      },
      field: 'messageType',
      minWidth: 120,
      title: '消息类型',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'sessionId',
      formatter: 'formatEmpty',
      minWidth: 180,
      title: '所属会话 ID',
    },
    {
      field: 'count',
      minWidth: 100,
      title: '产生消息数',
    },
  ];
}

/**
 * 汇总统计表格列
 */
export function useSummaryColumns(): VxeTableGridColumns<MessageSummaryDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'dateBucket',
      minWidth: 150,
      title: '统计周期 / 时间桶',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'sessionId',
      formatter: 'formatEmpty',
      minWidth: 180,
      title: '所属会话 ID',
    },
    {
      field: 'totalCount',
      minWidth: 120,
      title: '累计消息总量',
    },
  ];
}
