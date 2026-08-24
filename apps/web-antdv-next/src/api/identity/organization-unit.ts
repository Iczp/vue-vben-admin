import type { ListResultDto, PagedResultDto } from '#/api/abp/types';
import type {
  GetIdentityUsersInput,
  IdentityRoleDto,
  IdentityUserDto,
  OrganizationUnitCreateDto,
  OrganizationUnitDto,
  OrganizationUnitUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取 ABP 内置组织机构/部门列表
 */
export async function getOrganizationUnitsApi(params?: {
  maxResultCount?: number;
  skipCount?: number;
  sorting?: string;
}) {
  return requestClient.get<PagedResultDto<OrganizationUnitDto>>(
    '/identity/organization-units',
    { params },
  );
}

/**
 * 获取系统所有组织机构列表（用于构建部门树）
 */
export async function getAllOrganizationUnitsApi() {
  return requestClient.get<ListResultDto<OrganizationUnitDto>>(
    '/identity/organization-units/all',
  );
}

/**
 * 获取组织机构详情
 */
export async function getOrganizationUnitApi(id: string) {
  return requestClient.get<OrganizationUnitDto>(
    `/identity/organization-units/${id}`,
  );
}

/**
 * 创建组织机构/部门
 */
export async function createOrganizationUnitApi(
  data: OrganizationUnitCreateDto,
) {
  return requestClient.post<OrganizationUnitDto>(
    '/identity/organization-units',
    data,
  );
}

/**
 * 更新组织机构/部门
 */
export async function updateOrganizationUnitApi(
  id: string,
  data: OrganizationUnitUpdateDto,
) {
  return requestClient.put<OrganizationUnitDto>(
    `/identity/organization-units/${id}`,
    data,
  );
}

/**
 * 删除组织机构/部门
 */
export async function deleteOrganizationUnitApi(id: string) {
  return requestClient.delete<void>(`/identity/organization-units/${id}`);
}

/**
 * 获取指定组织机构下的用户成员
 */
export async function getOrganizationUnitMembersApi(
  id: string,
  params?: GetIdentityUsersInput,
) {
  return requestClient.get<PagedResultDto<IdentityUserDto>>(
    `/identity/organization-units/${id}/members`,
    { params },
  );
}

/**
 * 获取指定组织机构下的角色
 */
export async function getOrganizationUnitRolesApi(
  id: string,
  params?: { maxResultCount?: number; skipCount?: number },
) {
  return requestClient.get<PagedResultDto<IdentityRoleDto>>(
    `/identity/organization-units/${id}/roles`,
    { params },
  );
}
