import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

export interface AppVersionDto {
  appId: string;
  content?: string;
  creationTime?: string;
  deviceGroupIdList?: string[];
  features?: string[];
  id: string;
  isEnabled: boolean;
  isForce: boolean;
  isPublic: boolean;
  isWidget: boolean;
  issueDate?: string;
  pageUrl?: string;
  pkgUrl?: string;
  platform: string;
  title: string;
  version: string;
  versionCode: number;
}

export interface AppVersionCreateInput {
  appId: string;
  content?: string;
  deviceGroupIdList?: string[];
  features?: string[];
  isEnabled?: boolean;
  isForce?: boolean;
  isPublic?: boolean;
  isWidget?: boolean;
  issueDate?: string;
  pageUrl?: string;
  pkgUrl?: string;
  platform: string;
  title: string;
  version: string;
  versionCode: number;
}

export interface AppVersionUpdateInput extends Partial<AppVersionCreateInput> {}

export interface GetAppVersionInput extends PagedAndSortedResultRequestDto {
  appId?: string;
  isEnabled?: boolean;
  isForce?: boolean;
  isPublic?: boolean;
  keyword?: string;
  platform?: string;
}

/**
 * 分页获取 App 版本列表
 */
export async function getAppVersionsApi(params?: GetAppVersionInput) {
  return requestClient.get<PagedResultDto<AppVersionDto>>(
    '/chat/app-version',
    { params },
  );
}

/**
 * 获取 App 版本详情
 */
export async function getAppVersionApi(id: string) {
  return requestClient.get<AppVersionDto>(`/chat/app-version/${id}`);
}

/**
 * 创建 App 版本
 */
export async function createAppVersionApi(data: AppVersionCreateInput) {
  return requestClient.post<AppVersionDto>('/chat/app-version', data);
}

/**
 * 更新 App 版本
 */
export async function updateAppVersionApi(
  id: string,
  data: AppVersionUpdateInput,
) {
  return requestClient.post<AppVersionDto>(
    `/chat/app-version/${id}/update`,
    data,
  );
}

/**
 * 删除 App 版本
 */
export async function deleteAppVersionApi(id: string) {
  return requestClient.post<void>(`/chat/app-version/${id}/delete`);
}
