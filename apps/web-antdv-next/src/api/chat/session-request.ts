import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface SessionRequestAdminDto {
  creationTime: string;
  destinationId?: number | string;
  destinationName?: string;
  expirationTime?: string;
  handleMessage?: string;
  handleTime?: string;
  id: string;
  isAgreed?: boolean;
  isEnabled: boolean;
  isExpired: boolean;
  isHandled: boolean;
  ownerId: number | string;
  ownerName?: string;
  requestMessage?: string;
}

export interface SessionRequestAdminGetListInput {
  destinationId?: number | string;
  isAgreed?: boolean;
  isExpired?: boolean;
  isHandled?: boolean;
  keyword?: string;
  maxResultCount?: number;
  ownerId?: number | string;
  skipCount?: number;
}

export function getSessionRequestListApi(
  params?: SessionRequestAdminGetListInput,
) {
  return requestClient.get<PagedResultDto<SessionRequestAdminDto>>(
    '/chat/admin/session-request',
    { params },
  );
}

export function getSessionRequestDetailApi(id: string) {
  return requestClient.get<SessionRequestAdminDto>(
    `/chat/admin/session-request/${id}`,
  );
}

export function handleSessionRequestApi(
  id: string,
  input: { handleMessage?: string; isAgreed: boolean },
) {
  return requestClient.post<SessionRequestAdminDto>(
    `/chat/admin/session-request/${id}/handle`,
    input,
  );
}
