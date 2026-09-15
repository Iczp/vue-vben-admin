import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 消息报表类型枚举 (MessageReportTypes)
 * 20: Month 月,
 * 30: Day 日,
 * 40: Hour 时,
 */
export enum MessageReportTypes {
  Month = 20,
  Day = 30,
  Hour = 40,
}

/**
 * 消息类型枚举 (MessageTypes)
 */
export enum MessageTypes {
  Text = 0,
  Cmd = 1,
  Image = 2,
  Sound = 3,
  Video = 4,
  File = 5,
  Link = 6,
  Location = 7,
  Contacts = 8,
  RedEnvelope = 9,
  Html = 10,
  Article = 11,
  History = 12,
}

/**
 * 消息报表明细 DTO
 */
export interface MessageReportDto {
  count: number;
  dateBucket: number;
  messageType: MessageTypes;
  sessionId: string;
}

/**
 * 消息汇总 DTO
 */
export interface MessageSummaryDto {
  dateBucket: number;
  sessionId: string;
  totalCount: number;
}

/**
 * 消息报表选项配置
 */
export interface MessageReportOptions {
  enable?: boolean;
  flushToDbTimerPeriodSeconds?: number;
  useDistributedLock?: boolean;
}

/**
 * 报表查询入参
 */
export interface GetMessageReportInput extends PagedAndSortedResultRequestDto {
  dateBucket?: number | string;
  endDateBucket?: number | string;
  messageTypes?: MessageTypes[];
  reportType: MessageReportTypes; // 必选: 20: Month, 30: Day, 40: Hour
  sessionId?: string;
  startDateBucket?: number | string;
}

/**
 * 汇总查询入参
 */
export interface GetMessageSummaryInput extends PagedAndSortedResultRequestDto {
  dateBucket?: number | string;
  endDateBucket?: number | string;
  messageTypes?: MessageTypes[];
  reportType: MessageReportTypes;
  sessionId?: string;
  startDateBucket?: number | string;
}

/**
 * 统计落库入参
 */
export interface FlushMessageReportInput {
  dateBucket?: number | string;
  type: MessageReportTypes;
}

/**
 * 分页获取消息报表明细 (GET /api/chat/message-report)
 */
export async function getMessageReportListApi(params: GetMessageReportInput) {
  return requestClient.get<PagedResultDto<MessageReportDto>>(
    '/chat/message-report',
    { params },
  );
}

/**
 * 分页获取消息统计汇总 (GET /api/chat/message-report/summary)
 */
export async function getMessageReportSummaryApi(params: GetMessageSummaryInput) {
  return requestClient.get<PagedResultDto<MessageSummaryDto>>(
    '/chat/message-report/summary',
    { params },
  );
}

/**
 * 获取消息报表选项配置 (GET /api/chat/message-report/options)
 */
export async function getMessageReportOptionsApi() {
  return requestClient.get<MessageReportOptions>('/chat/message-report/options');
}

/**
 * 统计落库 (POST /api/chat/message-report/flush)
 */
export async function flushMessageReportApi(params: FlushMessageReportInput) {
  return requestClient.post<boolean>('/chat/message-report/flush', null, {
    params: {
      dateBucket: params.dateBucket,
      type: params.type,
    },
  });
}
