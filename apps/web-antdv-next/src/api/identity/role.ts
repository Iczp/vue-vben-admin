import type { ListResultDto, PagedResultDto } from '#/api/abp/types';
import type {
  GetIdentityRolesInput,
  IdentityRoleCreateDto,
  IdentityRoleDto,
  IdentityRoleUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取角色列表
 */
export async function getRolesApi(params?: GetIdentityRolesInput) {
  return requestClient.get<PagedResultDto<IdentityRoleDto>>(
    '/identity/roles',
    { params },
  );
}

/**
 * 获取系统所有角色
 */
export async function getAllRolesApi() {
  return requestClient.get<ListResultDto<IdentityRoleDto>>(
    '/identity/roles/all',
  );
}

/**
 * 获取指定角色详情
 */
export async function getRoleApi(id: string) {
  return requestClient.get<IdentityRoleDto>(`/identity/roles/${id}`);
}

/**
 * 创建新角色
 */
export async function createRoleApi(data: IdentityRoleCreateDto) {
  return requestClient.post<IdentityRoleDto>('/identity/roles', data);
}

/**
 * 更新角色信息
 */
export async function updateRoleApi(id: string, data: IdentityRoleUpdateDto) {
  return requestClient.put<IdentityRoleDto>(`/identity/roles/${id}`, data);
}

/**
 * 删除角色
 */
export async function deleteRoleApi(id: string) {
  return requestClient.delete<void>(`/identity/roles/${id}`);
}
