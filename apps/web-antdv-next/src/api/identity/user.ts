import type { ListResultDto, PagedResultDto } from '#/api/abp/types';
import type {
  GetIdentityUsersInput,
  IdentityRoleDto,
  IdentityUserCreateDto,
  IdentityUserDto,
  IdentityUserUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取用户列表
 */
export async function getUsersApi(params?: GetIdentityUsersInput) {
  return requestClient.get<PagedResultDto<IdentityUserDto>>(
    '/identity/users',
    { params },
  );
}

/**
 * 根据 ID 获取用户详情
 */
export async function getUserApi(id: string) {
  return requestClient.get<IdentityUserDto>(`/identity/users/${id}`);
}

/**
 * 创建新用户
 */
export async function createUserApi(data: IdentityUserCreateDto) {
  return requestClient.post<IdentityUserDto>('/identity/users', data);
}

/**
 * 更新用户信息
 */
export async function updateUserApi(id: string, data: IdentityUserUpdateDto) {
  return requestClient.put<IdentityUserDto>(`/identity/users/${id}`, data);
}

/**
 * 删除用户
 */
export async function deleteUserApi(id: string) {
  return requestClient.delete<void>(`/identity/users/${id}`);
}

/**
 * 获取指定用户的角色列表
 */
export async function getUserRolesApi(id: string) {
  return requestClient.get<ListResultDto<IdentityRoleDto>>(
    `/identity/users/${id}/roles`,
  );
}

/**
 * 获取系统所有可分配给用户的角色列表
 */
export async function getAssignableRolesApi() {
  return requestClient.get<ListResultDto<IdentityRoleDto>>(
    '/identity/users/assignable-roles',
  );
}
