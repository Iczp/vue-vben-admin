import type {
  GetPermissionListResultDto,
  GetPermissionParams,
  UpdatePermissionsDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 获取指定 Provider（如用户/角色）的权限列表
 */
export async function getPermissionsApi(params: GetPermissionParams) {
  return requestClient.get<GetPermissionListResultDto>(
    '/permission-management/permissions',
    { params },
  );
}

/**
 * 更新指定 Provider 的权限列表
 */
export async function updatePermissionsApi(
  params: GetPermissionParams,
  data: UpdatePermissionsDto,
) {
  return requestClient.put<void>(
    '/permission-management/permissions',
    data,
    { params },
  );
}

export * from './types';
