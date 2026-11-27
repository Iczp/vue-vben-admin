import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface SessionRoleAdminDto {
  creationTime: string;
  description?: string;
  id: string;
  isDefault: boolean;
  name: string;
  permissionCount: number;
  sessionId?: string;
  sessionTitle?: string;
}

export interface SessionRoleAdminGetListInput {
  isDefault?: boolean;
  keyword?: string;
  maxResultCount?: number;
  sessionId?: string;
  skipCount?: number;
}

export function getSessionRoleListApi(params?: SessionRoleAdminGetListInput) {
  return requestClient.get<PagedResultDto<SessionRoleAdminDto>>(
    '/chat/admin/session-role',
    { params },
  );
}

export function getSessionRoleDetailApi(id: string) {
  return requestClient.get<SessionRoleAdminDto>(
    `/chat/admin/session-role/${id}`,
  );
}
