import type {
  BatchImportResultDto,
  CreateSensitiveWordInput,
  GetSensitiveWordsInput,
  SensitiveWordBatchImportInput,
  SensitiveWordDto,
  SensitiveWordExportDto,
  UpdateSensitiveWordInput,
} from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 分页获取敏感词列表
 */
export async function getSensitiveWordsApi(params?: GetSensitiveWordsInput) {
  return requestClient.get<PagedResultDto<SensitiveWordDto>>(
    '/cms/admin/sensitive-words',
    { params },
  );
}

/**
 * 获取单个敏感词详情
 */
export async function getSensitiveWordApi(id: string) {
  return requestClient.get<SensitiveWordDto>(
    `/cms/admin/sensitive-words/${id}`,
  );
}

/**
 * 新建敏感词
 */
export async function createSensitiveWordApi(data: CreateSensitiveWordInput) {
  return requestClient.post<SensitiveWordDto>(
    '/cms/admin/sensitive-words',
    data,
  );
}

/**
 * 更新敏感词
 */
export async function updateSensitiveWordApi(
  id: string,
  data: UpdateSensitiveWordInput,
) {
  return requestClient.put<SensitiveWordDto>(
    `/cms/admin/sensitive-words/${id}`,
    data,
  );
}

/**
 * 删除敏感词
 */
export async function deleteSensitiveWordApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/sensitive-words/${id}`);
}

/**
 * 启用敏感词
 */
export async function enableSensitiveWordApi(id: string) {
  return requestClient.post<void>(`/cms/admin/sensitive-words/${id}/enable`);
}

/**
 * 禁用敏感词
 */
export async function disableSensitiveWordApi(id: string) {
  return requestClient.post<void>(`/cms/admin/sensitive-words/${id}/disable`);
}

/**
 * 批量导入敏感词
 */
export async function importSensitiveWordsApi(
  data: SensitiveWordBatchImportInput,
) {
  return requestClient.post<BatchImportResultDto>(
    '/cms/admin/sensitive-words/import',
    data,
  );
}

/**
 * 导出敏感词清单
 */
export async function exportSensitiveWordsApi(params?: GetSensitiveWordsInput) {
  return requestClient.get<SensitiveWordExportDto[]>(
    '/cms/admin/sensitive-words/export',
    { params },
  );
}
