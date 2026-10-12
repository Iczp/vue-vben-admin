import type { PagedResultDto } from '#/api/abp/types';
import type {
  SensitiveWordSyncBatchDetailDto,
  SensitiveWordSyncBatchDto,
  SensitiveWordSyncBatchGetListInput,
  SensitiveWordSyncBatchIgnoreInput,
  SensitiveWordSyncItemDto,
  SensitiveWordSyncItemGetListInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取词库同步批次列表
 */
export async function getSensitiveWordSyncBatchesApi(
  params?: SensitiveWordSyncBatchGetListInput,
) {
  return requestClient.get<PagedResultDto<SensitiveWordSyncBatchDto>>(
    '/cms/admin/sensitive-word-sync-batches',
    { params },
  );
}

/**
 * 获取批次详情
 */
export async function getSensitiveWordSyncBatchApi(id: string) {
  return requestClient.get<SensitiveWordSyncBatchDetailDto>(
    `/cms/admin/sensitive-word-sync-batches/${id}`,
  );
}

/**
 * 分页获取批次的差异明细项（支持 Added/Updated/Removed/Conflicts）
 */
export async function getSensitiveWordSyncBatchItemsApi(
  id: string,
  params?: SensitiveWordSyncItemGetListInput,
) {
  return requestClient.get<PagedResultDto<SensitiveWordSyncItemDto>>(
    `/cms/admin/sensitive-word-sync-batches/${id}/items`,
    { params },
  );
}

/**
 * 整批应用同步批次到草稿管理态（大数据量支持长超时）
 */
export async function applySensitiveWordSyncBatchApi(id: string) {
  return requestClient.post<SensitiveWordSyncBatchDto>(
    `/cms/admin/sensitive-word-sync-batches/${id}/apply`,
    undefined,
    {
      timeout: 300_000, // 5 分钟超时，防止大词库应用批次被浏览器端中断
    },
  );
}

/**
 * 忽略同步批次
 */
export async function ignoreSensitiveWordSyncBatchApi(
  id: string,
  data?: SensitiveWordSyncBatchIgnoreInput,
) {
  return requestClient.post<SensitiveWordSyncBatchDto>(
    `/cms/admin/sensitive-word-sync-batches/${id}/ignore`,
    data,
  );
}

/**
 * 废弃（作废）同步批次
 */
export async function supersedeSensitiveWordSyncBatchApi(id: string) {
  return requestClient.post<SensitiveWordSyncBatchDto>(
    `/cms/admin/sensitive-word-sync-batches/${id}/supersede`,
  );
}
