import type { PagedAndSortedResultRequestDto, PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface MessageTemplateRevisionDto {
  creationTime: string;
  definitionHash: string;
  definitionJson: string;
  description?: string;
  id: string;
  templateId: string;
  version: number;
}

export interface MessageTemplateDefinitionDto {
  category?: string;
  creationTime: string;
  creatorId?: string;
  currentVersion: number;
  description?: string;
  draftJson: string;
  id: string;
  lastModificationTime?: string;
  latestPublishedVersion: number;
  name: string;
  revisions?: MessageTemplateRevisionDto[];
  status: number;
  visibility: number;
}

export interface MessageTemplateGetListInput extends PagedAndSortedResultRequestDto {
  category?: string;
  keyword?: string;
  status?: number;
  visibility?: number;
}

export interface MessageTemplateCreateInput {
  category?: string;
  description?: string;
  draftJson: string;
  name: string;
  visibility: number;
}

export interface MessageTemplateUpdateInput {
  category?: string;
  description?: string;
  draftJson: string;
  name: string;
  visibility: number;
}

export interface MessageTemplatePublishInput {
  description?: string;
}

export interface SendTemplateMessageInput {
  clientMessageId: string;
  data: Record<string, unknown>;
  ignoreVersion?: boolean;
  templateId: string;
  templateVersion: number;
}

/** 获取模板列表 */
export function getMessageTemplateListApi(params: MessageTemplateGetListInput) {
  return requestClient.get<PagedResultDto<MessageTemplateDefinitionDto>>(
    '/chat/message-template',
    { params },
  );
}

/** 获取模板详情 */
export function getMessageTemplateApi(id: string) {
  return requestClient.get<MessageTemplateDefinitionDto>(
    `/chat/message-template/${id}`,
  );
}

/** 创建模板草稿 */
export function createMessageTemplateApi(input: MessageTemplateCreateInput) {
  return requestClient.post<MessageTemplateDefinitionDto>(
    '/chat/message-template',
    input,
  );
}

/** 更新模板草稿 */
export function updateMessageTemplateApi(
  id: string,
  input: MessageTemplateUpdateInput,
) {
  return requestClient.put<MessageTemplateDefinitionDto>(
    `/chat/message-template/${id}`,
    input,
  );
}

/** 删除模板 */
export function deleteMessageTemplateApi(id: string) {
  return requestClient.delete(`/chat/message-template/${id}`);
}

/** 发布新版本 */
export function publishMessageTemplateApi(
  id: string,
  input: MessageTemplatePublishInput,
) {
  return requestClient.post<MessageTemplateRevisionDto>(
    `/chat/message-template/${id}/publish`,
    input,
  );
}

/** 启用模板 */
export function enableMessageTemplateApi(id: string) {
  return requestClient.post(`/chat/message-template/${id}/enable`);
}

/** 停用模板 */
export function disableMessageTemplateApi(id: string) {
  return requestClient.post(`/chat/message-template/${id}/disable`);
}

/** 测试发送模板消息 */
export function sendTemplateContentMessageApi(
  sessionUnitId: string,
  input: SendTemplateMessageInput,
) {
  return requestClient.post(
    `/chat/message-sender/send-template-content-message/${sessionUnitId}`,
    input,
  );
}
