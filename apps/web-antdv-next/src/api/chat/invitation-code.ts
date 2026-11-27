import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 邀请码 DTO (ChatAdmin)
 */
export interface InvitationCodeDto {
  code?: string;
  creationTime?: string;
  creatorId?: string;
  expirationTime?: string;
  extraProperties?: Record<string, any>;
  id: string;
  isEnabled?: boolean;
  maskedCode?: string;
  ownerId?: string;
  title: string;
}

export interface InvitationCodeCreateInput {
  expirationTime?: string;
  ownerId?: number | string;
  title: string;
}

export interface InvitationCodeUpdateInput {
  expirationTime?: string;
  isEnabled?: boolean;
  title: string;
}

export interface GetInvitationCodeInput extends PagedAndSortedResultRequestDto {
  isEnabled?: boolean;
  keyword?: string;
  ownerId?: number | string;
}

/**
 * 分页获取邀请码列表 (ChatAdmin)
 */
export async function getInvitationCodesApi(params?: GetInvitationCodeInput) {
  return requestClient.get<PagedResultDto<InvitationCodeDto>>(
    '/chat/admin/invitation-code',
    { params },
  );
}

/**
 * 获取邀请码详情 (ChatAdmin)
 */
export async function getInvitationCodeApi(id: string) {
  return requestClient.get<InvitationCodeDto>(
    `/chat/admin/invitation-code/${id}`,
  );
}

/**
 * 创建邀请码 (ChatAdmin)
 */
export async function createInvitationCodeApi(data: InvitationCodeCreateInput) {
  return requestClient.post<InvitationCodeDto>(
    '/chat/admin/invitation-code',
    data,
  );
}

/**
 * 更新邀请码 (ChatAdmin)
 */
export async function updateInvitationCodeApi(
  id: string,
  data: InvitationCodeUpdateInput,
) {
  return requestClient.put<InvitationCodeDto>(
    `/chat/admin/invitation-code/${id}`,
    data,
  );
}

/**
 * 启停邀请码 (ChatAdmin)
 */
export async function setInvitationCodeIsEnabledApi(
  id: string,
  isEnabled: boolean,
) {
  return requestClient.post<InvitationCodeDto>(
    `/chat/admin/invitation-code/${id}/set-is-enabled`,
    { isEnabled },
  );
}

/**
 * 删除邀请码 (ChatAdmin)
 */
export async function deleteInvitationCodeApi(id: string) {
  return requestClient.delete<void>(`/chat/admin/invitation-code/${id}`);
}
