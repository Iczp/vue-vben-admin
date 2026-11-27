import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

import { parseArticleResponse } from './article-message';

export interface MessageAdminListItemDto {
  channel: number | string;
  creationTime: string;
  id: number | string;
  isPrivate: boolean;
  isRollbacked: boolean;
  messageType: number | string;
  receiverId?: number | string;
  receiverName?: string;
  rollbackTime?: string;
  senderId?: number | string;
  senderName?: string;
  sessionId?: string;
  sessionSeq: number;
  size: number;
}

export interface MessageAdminDetailDto extends MessageAdminListItemDto {
  clientMessageId?: string;
  contentJson?: string;
  receiverSessionUnitId?: string;
  senderSessionUnitId?: string;
}

export interface MessageAdminGetListInput {
  isPrivate?: boolean;
  isRollbacked?: boolean;
  maxMessageId?: number | string;
  maxResultCount?: number;
  messageType?: number;
  receiverId?: number | string;
  senderId?: number | string;
  sessionId?: string;
  skipCount?: number;
}

const responseOptions = { transformResponse: [parseArticleResponse] };

export function getMessageAdminListApi(params?: MessageAdminGetListInput) {
  return requestClient.get<PagedResultDto<MessageAdminListItemDto>>(
    '/chat/admin/message',
    {
      ...responseOptions,
      params,
    },
  );
}

export function getMessageAdminDetailApi(id: number | string) {
  return requestClient.get<MessageAdminDetailDto>(
    `/chat/admin/message/${id}`,
    responseOptions,
  );
}

export function rollbackMessageAdminApi(id: number | string) {
  return requestClient.post<Record<string, number | string>>(
    `/chat/admin/message/rollback/${id}`,
    undefined,
    responseOptions,
  );
}
