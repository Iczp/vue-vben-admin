import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { MessageReportDto, MessageSummaryDto } from '#/api/chat/message-report';
import { MessageReportTypes, MessageTypes } from '#/api/chat/message-report';

/**
 * 消息类型中文映射与标签颜色
 */
export const messageTypeOptions = [
  { color: 'blue', label: '文本 (Text)', value: MessageTypes.Text },
  { color: 'default', label: '系统通知 (Cmd)', value: MessageTypes.Cmd },
  { color: 'green', label: '图片 (Image)', value: MessageTypes.Image },
  { color: 'purple', label: '语音 (Sound)', value: MessageTypes.Sound },
  { color: 'orange', label: '视频 (Video)', value: MessageTypes.Video },
  { color: 'cyan', label: '文件 (File)', value: MessageTypes.File },
  { color: 'geekblue', label: '链接 (Link)', value: MessageTypes.Link },
  { color: 'gold', label: '位置 (Location)', value: MessageTypes.Location },
  { color: 'magenta', label: '名片 (Contacts)', value: MessageTypes.Contacts },
  { color: 'red', label: '红包 (RedEnvelope)', value: MessageTypes.RedEnvelope },
  { color: 'volcano', label: 'HTML', value: MessageTypes.Html },
  { color: 'lime', label: '文章 (Article)', value: MessageTypes.Article },
  { color: 'processing', label: '聊天记录 (History)', value: MessageTypes.History },
];

/**
 * 报表类型选择项
 */
export const reportTypeOptions = [
  { label: '📅 日报 (Day)', value: MessageReportTypes.Day },
  { label: '⏰ 时报 (Hour)', value: MessageReportTypes.Hour },
  { label: '🗓️ 月报 (Month)', value: MessageReportTypes.Month },
];

/**
 * 将长整数 DateBucket 格式化为易读的日期时间字符串
 * 202609 -> 2026-09
 * 20260914 -> 2026-09-14
 * 2026091417 -> 2026-09-14 17:00
 */
export function formatDateBucket(val?: number | string): string {
  if (!val) return '-';
  const str = String(val);
  if (str.length === 6) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}`;
  }
  if (str.length === 8) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
  if (str.length === 10) {
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)} ${str.slice(8, 10)}:00`;
  }
  return str;
}

/**
 * 报表明细表格列定义
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
      formatter: ({ cellValue }) => formatDateBucket(cellValue),
      minWidth: 160,
      title: '统计周期 / 时间桶',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: messageTypeOptions,
      },
      field: 'messageType',
      minWidth: 140,
      title: '消息类型',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'sessionId',
      formatter: 'formatEmpty',
      minWidth: 200,
      title: '会话 ID (SessionId)',
    },
    {
      field: 'count',
      minWidth: 120,
      title: '产生消息量',
    },
  ];
}

/**
 * 汇总统计表格列定义
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
      formatter: ({ cellValue }) => formatDateBucket(cellValue),
      minWidth: 180,
      title: '统计周期 / 时间桶',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'sessionId',
      formatter: 'formatEmpty',
      minWidth: 220,
      title: '所属会话 ID (SessionId)',
    },
    {
      field: 'totalCount',
      minWidth: 140,
      title: '累计消息总量',
    },
  ];
}
