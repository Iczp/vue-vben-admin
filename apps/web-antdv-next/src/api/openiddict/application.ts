import type { PagedResultDto } from '#/api/abp/types';
import type {
  ApplicationCreateInput,
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
    '/api/openiddict/application',
    { params },
  );
}

/**
 * 获取应用详情
 */
export async function getApplicationApi(id: string) {
  return requestClient.get<ApplicationDto>(`/api/openiddict/application/${id}`);
}

/**
 * 创建应用
 */
export async function createApplicationApi(data: ApplicationCreateInput) {
  return requestClient.post<ApplicationDto>(
    '/api/openiddict/application',
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
  return requestClient.put<ApplicationDto>(
    `/api/openiddict/application/${id}`,
    data,
  );
}

/**
 * 删除应用
 */
export async function deleteApplicationApi(id: string) {
  return requestClient.delete<void>(`/api/openiddict/application/${id}`);
}

/**
 * 随机生成客户端密钥
 */
export async function generateClientSecretApi() {
  return requestClient.post<string>(
    '/api/openiddict/application/generate-client-secret',
  );
}
