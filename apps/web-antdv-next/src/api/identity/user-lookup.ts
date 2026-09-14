import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 用户查找项 DTO
 */
export interface UserDataDto {
  email?: string;
  extraProperties?: Record<string, any>;
  id: string;
  isActive?: boolean;
  name?: string;
  phoneNumber?: string;
  surname?: string;
  tenantId?: null | string;
  userName: string;
}

export interface UserLookupSearchInput extends PagedAndSortedResultRequestDto {
  filter?: string;
}

/**
 * 远程检索用户列表
 */
export async function searchUserLookupApi(params?: UserLookupSearchInput) {
  return requestClient.get<PagedResultDto<UserDataDto>>(
    '/identity/users/lookup/search',
    { params },
  );
}

/**
 * 根据 ID 查找指定用户
 */
export async function getUserLookupByIdApi(id: string) {
  return requestClient.get<UserDataDto>(`/identity/users/lookup/${id}`);
}

/**
 * 根据用户名查找用户
 */
export async function getUserLookupByUserNameApi(userName: string) {
  return requestClient.get<UserDataDto>(
    `/identity/users/lookup/by-username/${userName}`,
  );
}

/**
 * 获取符合条件的用户总数
 */
export async function getUserLookupCountApi(filter?: string) {
  return requestClient.get<number>('/identity/users/lookup/count', {
    params: { filter },
  });
}
