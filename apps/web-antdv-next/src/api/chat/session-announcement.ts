import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface SessionAnnouncementAdminDto {
  chatObjectId: number | string;
  confirmedCount: number;
  content: string;
  creationTime: string;
  expireTime?: string;
  id: string;
  isApproved: boolean;
  isPinned: boolean;
  isPopup: boolean;
  publisherChatObjectId: number | string;
  publisherName?: string;
  publishTime?: string;
  readCount: number;
  requireConfirm: boolean;
  sessionId?: string;
  sessionTitle?: string;
  status: number | string;
  title: string;
  version: number;
}

export interface SessionAnnouncementAdminGetListInput {
  isPinned?: boolean;
  keyword?: string;
  maxResultCount?: number;
  sessionId?: string;
  skipCount?: number;
  status?: number;
}

export function getSessionAnnouncementListApi(
  params?: SessionAnnouncementAdminGetListInput,
) {
  return requestClient.get<PagedResultDto<SessionAnnouncementAdminDto>>(
    '/chat/admin/session-announcement',
    { params },
  );
}

export function getSessionAnnouncementDetailApi(id: string) {
  return requestClient.get<SessionAnnouncementAdminDto>(
    `/chat/admin/session-announcement/${id}`,
  );
}

export function setSessionAnnouncementPinnedApi(id: string, isPinned: boolean) {
  return requestClient.post<SessionAnnouncementAdminDto>(
    `/chat/admin/session-announcement/${id}/set-pinned`,
    { isPinned },
  );
}
