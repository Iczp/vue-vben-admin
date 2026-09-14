import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 消息报表明细 DTO
 */
export interface MessageReportDto {
  count?: number;
  dateBucket?: string;
  messageType?: number;
  sessionId?: string;
}

/**
 * 消息汇总 DTO
 */
export interface MessageSummaryDto {
  dateBucket?: string;
  sessionId?: string;
  totalCount?: number;
}

/**
 * 消息报表选项
 */
export interface MessageReportOptions {
  enable?: boolean;
  flushToDbTimerPeriodSeconds?: number;
  useDistributedLock?: boolean;
}

export interface GetMessageReportInput extends PagedAndSortedResultRequestDto {
  dateBucket?: string;
  endDateBucket?: string;
  messageTypes?: number[];
  reportType?: number;
  sessionId?: string;
  startDateBucket?: string;
}

/**
 * 分页获取消息报表明细
 */
export async function getMessageReportListApi(params?: GetMessageReportInput) {
  return requestClient.get<PagedResultDto<MessageReportDto>>(
    '/chat/message-report',
    { params },
  );
}

/**
 * 分页获取消息统计汇总
 */
export async function getMessageReportSummaryApi(params?: GetMessageReportInput) {
  return requestClient.get<PagedResultDto<MessageSummaryDto>>(
    '/chat/message-report/summary',
    { params },
  );
}

/**
 * 获取消息报表选项配置
 */
export async function getMessageReportOptionsApi() {
  return requestClient.get<MessageReportOptions>('/chat/message-report/options');
}

/**
 * 立即刷写统计缓存到数据库
 */
export async function flushMessageReportApi() {
  return requestClient.post<void>('/chat/message-report/flush');
}
