import type { PagedResultDto } from '#/api/abp/types';
import type {
  GetTenantsInput,
  TenantCreateDto,
  TenantDto,
  TenantUpdateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取租户列表
 */
export async function getTenantsApi(params?: GetTenantsInput) {
  return requestClient.get<PagedResultDto<TenantDto>>(
    '/multi-tenancy/tenants',
    { params },
  );
}

/**
 * 获取租户详情
 */
export async function getTenantApi(id: string) {
  return requestClient.get<TenantDto>(`/multi-tenancy/tenants/${id}`);
}

/**
 * 创建租户
 */
export async function createTenantApi(data: TenantCreateDto) {
  return requestClient.post<TenantDto>('/multi-tenancy/tenants', data);
}

/**
 * 更新租户
 */
export async function updateTenantApi(id: string, data: TenantUpdateDto) {
  return requestClient.put<TenantDto>(`/multi-tenancy/tenants/${id}`, data);
}

/**
 * 删除租户
 */
export async function deleteTenantApi(id: string) {
  return requestClient.delete<void>(`/multi-tenancy/tenants/${id}`);
}

/**
 * 获取租户默认数据库连接字符串
 */
export async function getDefaultConnectionStringApi(id: string) {
  return requestClient.get<string>(
    `/multi-tenancy/tenants/${id}/default-connection-string`,
  );
}

/**
 * 设置租户默认数据库连接字符串
 */
export async function updateDefaultConnectionStringApi(
  id: string,
  defaultConnectionString: string,
) {
  return requestClient.put<void>(
    `/multi-tenancy/tenants/${id}/default-connection-string`,
    undefined,
    { params: { defaultConnectionString } },
  );
}

/**
 * 删除租户默认数据库连接字符串（恢复使用宿主默认数据库）
 */
export async function deleteDefaultConnectionStringApi(id: string) {
  return requestClient.delete<void>(
    `/multi-tenancy/tenants/${id}/default-connection-string`,
  );
}
