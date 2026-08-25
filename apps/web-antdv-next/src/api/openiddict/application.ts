import type { PagedResultDto } from '#/api/abp/types';
import type {
  ApplicationCreateInput,
  ApplicationDetailDto,
  ApplicationDto,
  ApplicationUpdateInput,
  GetApplicationsInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取 OpenIddict 应用列表
 */
export async function getApplicationsApi(params?: GetApplicationsInput) {
  return requestClient.get<PagedResultDto<ApplicationDto>>(
    '/openiddict/application',
    { params },
  );
}

/**
 * 获取应用详情
 */
export async function getApplicationApi(id: string) {
  return requestClient.get<ApplicationDetailDto>(
    `/openiddict/application/${id}`,
  );
}

/**
 * 创建应用
 */
export async function createApplicationApi(data: ApplicationCreateInput) {
  return requestClient.post<ApplicationDetailDto>(
    '/openiddict/application',
    data,
  );
}

/**
 * 更新应用
 */
export async function updateApplicationApi(
  id: string,
  data: ApplicationUpdateInput,
) {
  return requestClient.put<ApplicationDetailDto>(
    `/openiddict/application/${id}`,
    data,
  );
}

/**
 * 删除应用
 */
export async function deleteApplicationApi(id: string) {
  return requestClient.delete<void>(`/openiddict/application/${id}`);
}

/**
 * 随机生成客户端密钥
 */
export async function generateClientSecretApi() {
  return requestClient.post<string>(
    '/openiddict/application/generate-client-secret',
  );
}

/**
 * 设置/重置客户端密钥
 */
export async function setClientSecretApi(data: {
  clientSecret: string;
  id: string;
}) {
  return requestClient.post<void>(
    '/openiddict/application/set-client-secret',
    data,
  );
}

/**
 * 获取客户端类型列表
 */
export async function getClientTypesApi() {
  return requestClient.get<Array<{ displayName: string; value: string }>>(
    '/openiddict/consts/client-types',
  );
}

/**
 * 获取授权许可类型列表
 */
export async function getConsentTypesApi() {
  return requestClient.get<Array<{ displayName: string; value: string }>>(
    '/openiddict/consts/consent-types',
  );
}

/**
 * 获取授权模式 (Grant Types) 列表
 */
export async function getGrantTypesApi() {
  return requestClient.get<Array<{ displayName: string; value: string }>>(
    '/openiddict/consts/grant-types',
  );
}

/**
 * 获取 OpenIddict 常量权限树
 */
export async function getConstantsTreeApi() {
  return requestClient.get<any>(
    '/openiddict/consts/open-iddict-constants-tree',
  );
}
