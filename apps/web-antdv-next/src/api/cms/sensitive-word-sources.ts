import type { PagedResultDto } from '#/api/abp/types';
import type {
  SensitiveWordSourceCreateInput,
  SensitiveWordSourceDetailDto,
  SensitiveWordSourceDto,
  SensitiveWordSourceGetListInput,
  SensitiveWordSourceSnapshotDto,
  SensitiveWordSourceUpdateInput,
  SourceCheckResultDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取敏感词外部数据源列表
 */
export async function getSensitiveWordSourcesApi(params?: SensitiveWordSourceGetListInput) {
  return requestClient.get<PagedResultDto<SensitiveWordSourceDto>>(
    '/cms/admin/sensitive-word-sources',
    { params },
  );
}

/**
 * 获取单个外部数据源详情
 */
export async function getSensitiveWordSourceApi(id: string) {
  return requestClient.get<SensitiveWordSourceDetailDto>(
    `/cms/admin/sensitive-word-sources/${id}`,
  );
}

/**
 * 创建外部数据源
 */
export async function createSensitiveWordSourceApi(data: SensitiveWordSourceCreateInput) {
  return requestClient.post<SensitiveWordSourceDetailDto>(
    '/cms/admin/sensitive-word-sources',
    data,
  );
}

/**
 * 更新外部数据源
 */
export async function updateSensitiveWordSourceApi(
  id: string,
  data: SensitiveWordSourceUpdateInput,
) {
  return requestClient.put<SensitiveWordSourceDetailDto>(
    `/cms/admin/sensitive-word-sources/${id}`,
    data,
  );
}

/**
 * 删除外部数据源
 */
export async function deleteSensitiveWordSourceApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/sensitive-word-sources/${id}`);
}

/**
 * 启用外部数据源
 */
export async function enableSensitiveWordSourceApi(id: string) {
  return requestClient.post<void>(`/cms/admin/sensitive-word-sources/${id}/enable`);
}

/**
 * 禁用外部数据源
 */
export async function disableSensitiveWordSourceApi(id: string) {
  return requestClient.post<void>(`/cms/admin/sensitive-word-sources/${id}/disable`);
}

/**
 * 检查外部数据源更新
 */
export async function checkSensitiveWordSourceApi(id: string) {
  return requestClient.post<SourceCheckResultDto>(
    `/cms/admin/sensitive-word-sources/${id}/check`,
  );
}

/**
 * 触发外部数据源同步，返回生成的批次 Id
 */
export async function syncSensitiveWordSourceApi(id: string) {
  return requestClient.post<string>(
    `/cms/admin/sensitive-word-sources/${id}/sync`,
  );
}

/**
 * 初始化系统默认推荐开源词库
 */
export async function initializeDefaultSourcesApi() {
  return requestClient.post<void>(
    '/cms/admin/sensitive-word-sources/initialize-defaults',
  );
}

/**
 * 获取数据源的历史快照列表
 */
export async function getSensitiveWordSourceSnapshotsApi(id: string) {
  return requestClient.get<SensitiveWordSourceSnapshotDto[]>(
    `/cms/admin/sensitive-word-sources/${id}/snapshots`,
  );
}
