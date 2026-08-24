import type { ApplicationConfigurationDto } from './types';

import { requestClient } from '#/api/request';

/**
 * 获取 ABP 应用程序配置（包含 CurrentUser、CurrentTenant、GrantedPolicies、Localization 等）
 */
export async function getApplicationConfigurationApi(params?: {
  includeLocalizationResources?: boolean;
}) {
  return requestClient.get<ApplicationConfigurationDto>(
    '/api/abp/application-configuration',
    { params },
  );
}
