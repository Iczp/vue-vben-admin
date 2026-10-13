import type { ChatObjectDto } from './chat-object';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export const articleManagementPermission =
  'ChatPermissions.MessageSenderPermission.ManageArticle';
export interface ArticleMessageItem {
  author: string;
  coverImageUrl: string;
  description: string;
  originalUrl: string;
  title: string;
}
export interface ArticleMessageInput {
  clientMessageId: string;
  content: { items: ArticleMessageItem[] };
}
export interface ArticleSenderSession {
  destination?: ChatObjectDto;
  id: string;
  ownerId: number | string;
  sessionId: string;
  setting?: { isInputEnabled?: boolean; isKilled?: boolean };
}
export interface ArticleChatMessage {
  content?: unknown;
  creationTime: string;
  id: number | string;
  isRollbacked: boolean;
  messageType: number;
  messageTypeDescription?: string;
  senderId?: number | string;
  senderName?: string;
}
export interface ArticleHistoryResult extends PagedResultDto<ArticleChatMessage> {
  extra?: { hasMore?: boolean; nextCursorId?: number | string };
}
export interface ArticleSchedule {
  attempts: number;
  content: { items: ArticleMessageItem[] };
  id: string;
  lastError?: string;
  messageId?: number | string;
  scheduledAt: string;
  senderSessionUnitId: string;
  sentAt?: string;
  status: number;
}

// Preserve SQL bigint IDs before JSON.parse rounds them in JavaScript.
export function parseArticleResponse(raw: unknown): unknown {
  if (typeof raw !== 'string' || !raw) return raw;
  let result = '';
  let quoted = false;
  let escaped = false;
  for (let index = 0; index < raw.length; index++) {
    const char = raw[index]!;
    if (quoted) {
      result += char;
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') {
      quoted = true;
      result += char;
    } else if (char === '-' || /\d/.test(char)) {
      const token = raw
        .slice(index)
        .match(/^-?\d+(?:\.\d+)?(?:[Ee][+-]?\d+)?/)?.[0];
      if (!token) {
        result += char;
        continue;
      }
      result +=
        /^-?\d+$/.test(token) && !Number.isSafeInteger(Number(token))
          ? `"${token}"`
          : token;
      index += token.length - 1;
    } else result += char;
  }
  return JSON.parse(result);
}
const responseOptions = { transformResponse: [parseArticleResponse] };

export function getArticleSenderSessionsApi(
  ownerId: number | string,
  skipCount = 0,
  keyword = '',
) {
  return requestClient.get<PagedResultDto<ArticleSenderSession>>(
    '/chat/session-unit',
    {
      ...responseOptions,
      params: {
        isKilled: false,
        keyword,
        maxResultCount: 50,
        ownerId,
        skipCount,
      },
    },
  );
}
export function sendArticleMessageApi(
  sessionUnitId: string,
  input: ArticleMessageInput,
) {
  return requestClient.post<ArticleChatMessage>(
    `/chat/message-sender/send-article-content-message/${sessionUnitId}`,
    input,
    responseOptions,
  );
}
export function getArticleChatHistoryApi(
  sessionUnitId: string,
  maxMessageId?: number | string,
) {
  return requestClient.get<ArticleHistoryResult>('/chat/message/history', {
    ...responseOptions,
    params: { maxMessageId, maxResultCount: 20, sessionUnitId },
  });
}
export function rollbackArticleMessageApi(messageId: number | string) {
  return requestClient.post<Record<string, number | string>>(
    `/chat/message-sender/rollback/${messageId}`,
    undefined,
    responseOptions,
  );
}
export function createArticleScheduleApi(input: {
  id: string;
  message: ArticleMessageInput;
  scheduledAt: string;
  senderSessionUnitId: string;
}) {
  return requestClient.post<ArticleSchedule>(
    '/chat/article-message-schedule',
    input,
    responseOptions,
  );
}
export function getArticleSchedulesApi(
  senderSessionUnitId: string,
  skipCount = 0,
) {
  return requestClient.get<PagedResultDto<ArticleSchedule>>(
    '/chat/article-message-schedule',
    {
      ...responseOptions,
      params: { maxResultCount: 20, senderSessionUnitId, skipCount },
    },
  );
}
export function changeArticleScheduleApi(
  id: string,
  action: 'cancel' | 'execute-now' | 'reschedule',
  scheduledAt?: string,
) {
  return requestClient.post<ArticleSchedule>(
    `/chat/article-message-schedule/${id}/${action}`,
    scheduledAt ? { scheduledAt } : undefined,
    responseOptions,
  );
}
