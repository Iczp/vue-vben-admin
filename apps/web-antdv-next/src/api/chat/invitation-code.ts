import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 邀请码 DTO
 */
export interface InvitationCodeDto {
  creationTime?: string;
  creatorId?: string;
  extraProperties?: Record<string, any>;
  id: string;
  ownerId?: string;
  title: string;
}

export interface InvitationCodeCreateInput {
  ownerId?: string;
  title: string;
}

export interface InvitationCodeUpdateInput {
  title: string;
}

export interface GetInvitationCodeInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
}

/**
 * 分页获取邀请码列表
 */
export async function getInvitationCodesApi(params?: GetInvitationCodeInput) {
  return requestClient.get<PagedResultDto<InvitationCodeDto>>(
    '/chat/invitation-code',
    { params },
  );
}

/**
 * 获取邀请码详情
 */
export async function getInvitationCodeApi(id: string) {
  return requestClient.get<InvitationCodeDto>(`/chat/invitation-code/${id}`);
}

/**
 * 创建邀请码
 */
export async function createInvitationCodeApi(data: InvitationCodeCreateInput) {
  return requestClient.post<InvitationCodeDto>('/chat/invitation-code', data);
}

/**
 * 更新邀请码
 */
export async function updateInvitationCodeApi(
  id: string,
  data: InvitationCodeUpdateInput,
) {
  return requestClient.post<InvitationCodeDto>(
    `/chat/invitation-code/${id}/update`,
    data,
  );
}

/**
 * 删除邀请码
 */
export async function deleteInvitationCodeApi(id: string) {
  return requestClient.post<void>(`/chat/invitation-code/${id}/delete`);
}
