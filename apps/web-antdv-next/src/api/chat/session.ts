import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface SessionAdminDto {
  channel: number | string;
  creationTime: string;
  description?: string;
  firstMessageId?: number | string;
  id: string;
  isAllMuted: boolean;
  isEnabled: boolean;
  lastMessageId?: number | string;
  lastMessageSeq: number;
  messageTotalCount: number;
  ownerId?: number | string;
  ownerName?: string;
  sessionKey?: string;
  title?: string;
}

export interface SessionAdminGetListInput {
  channel?: number;
  isAllMuted?: boolean;
  isEnabled?: boolean;
  keyword?: string;
  maxResultCount?: number;
  ownerId?: number | string;
  skipCount?: number;
}

export function getSessionListApi(params?: SessionAdminGetListInput) {
  return requestClient.get<PagedResultDto<SessionAdminDto>>(
    '/chat/admin/session',
    { params },
  );
}

export function getSessionDetailApi(id: string) {
  return requestClient.get<SessionAdminDto>(`/chat/admin/session/${id}`);
}

export function setSessionIsEnabledApi(id: string, isEnabled: boolean) {
  return requestClient.post<SessionAdminDto>(
    `/chat/admin/session/${id}/set-is-enabled`,
    { isEnabled },
  );
}

export function setSessionIsAllMutedApi(id: string, isAllMuted: boolean) {
  return requestClient.post<SessionAdminDto>(
    `/chat/admin/session/${id}/set-is-all-muted`,
    { isAllMuted },
  );
}
