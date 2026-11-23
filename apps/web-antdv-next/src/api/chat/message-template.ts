import type { ChatObjectDto, GetChatObjectInput } from './chat-object';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

import { parseArticleResponse } from './article-message';

export const templatePermission = 'ChatPermissions.MessageTemplatePermission';
export interface MessageTemplateDefinitionDto {
  concurrencyStamp: string;
  creationTime: string;
  description?: string;
  id: string;
  isEnabled: boolean;
  name: string;
  ownerId: number | string;
  publishedVersion?: null | number;
  visibility: 0 | 1;
}
export interface MessageTemplateDetailDto extends MessageTemplateDefinitionDto {
  draftJson: string;
}
export interface MessageTemplateRevisionDto {
  creationTime: string;
  definitionHash: string;
  id: string;
  schemaVersion: number;
  templateId: string;
  version: number;
}
export interface MessageTemplateRevisionDetailDto extends MessageTemplateRevisionDto {
  definitionJson: string;
}
export interface MessageTemplateGetListInput {
  keyword?: string;
  maxResultCount: number;
  ownerId?: string;
  scope: 'owned' | 'usable';
  skipCount: number;
}
export interface MessageTemplateCreateInput {
  definition: string;
  description?: string;
  name: string;
  ownerId: string;
  visibility: 0 | 1;
}
export type MessageTemplateUpdateInput = Omit<
  MessageTemplateCreateInput,
  'ownerId'
> & { concurrencyStamp: string };
export interface SendTemplateMessageInput {
  clientMessageId: string;
  content: {
    data: Record<string, unknown>;
    templateId: string;
    templateVersion: number;
  };
}
export interface TemplatePreviewOutput {
  errorMessage?: string;
  isValid: boolean;
  snapshot?: unknown;
}
const root = '/chat/message-template';
const responseOptions = { transformResponse: [parseArticleResponse] };
export function getTemplateSenderAccountsApi(params: GetChatObjectInput) {
  return requestClient.get<PagedResultDto<ChatObjectDto>>('/chat/chat-object', {
    ...responseOptions,
    params,
  });
}

export function getMessageTemplateListApi(params: MessageTemplateGetListInput) {
  return requestClient.get<PagedResultDto<MessageTemplateDefinitionDto>>(root, {
    ...responseOptions,
    params,
  });
}
export function getMessageTemplateApi(id: string) {
  return requestClient.get<MessageTemplateDetailDto>(
    `${root}/${id}`,
    responseOptions,
  );
}
export function createMessageTemplateApi(input: MessageTemplateCreateInput) {
  return requestClient.post<MessageTemplateDetailDto>(
    root,
    input,
    responseOptions,
  );
}
export function updateMessageTemplateApi(
  id: string,
  input: MessageTemplateUpdateInput,
) {
  return requestClient.put<MessageTemplateDetailDto>(
    `${root}/${id}`,
    input,
    responseOptions,
  );
}
export function publishMessageTemplateApi(
  id: string,
  input: { concurrencyStamp: string },
) {
  return requestClient.post<{
    concurrencyStamp: string;
    schemaVersion: number;
    templateId: string;
    version: number;
  }>(`${root}/${id}/publish`, input);
}
export function setMessageTemplateEnabledApi(
  id: string,
  input: { concurrencyStamp: string; isEnabled: boolean },
) {
  return requestClient.post<MessageTemplateDetailDto>(
    `${root}/${id}/set-enabled`,
    input,
    responseOptions,
  );
}
export function getMessageTemplateRevisionsApi(id: string, skipCount = 0) {
  return requestClient.get<PagedResultDto<MessageTemplateRevisionDto>>(
    `${root}/${id}/revisions`,
    { params: { maxResultCount: 20, skipCount } },
  );
}
export function getMessageTemplateRevisionApi(id: string, version: number) {
  return requestClient.get<MessageTemplateRevisionDetailDto>(
    `${root}/${id}/revisions/${version}`,
  );
}
export function previewMessageTemplateApi(input: {
  data: Record<string, unknown>;
  definition: string;
  templateId: string;
}) {
  return requestClient.post<TemplatePreviewOutput>(
    `${root}/preview`,
    input,
    responseOptions,
  );
}
export function sendTemplateContentMessageApi(
  sessionUnitId: string,
  input: SendTemplateMessageInput,
) {
  return requestClient.post<{ id: string }>(
    `/chat/message-sender/send-template-content-message/${sessionUnitId}`,
    input,
    responseOptions,
  );
}
