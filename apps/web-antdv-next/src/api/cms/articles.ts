import type { PagedResultDto } from '#/api/abp/types';
import type {
  AdminArticleBatchCategoriesInput,
  AdminArticleBatchIdsInput,
  AdminArticleBatchStatusInput,
  AdminArticleBatchTagsInput,
  AdminArticleCreateInput,
  AdminArticleDetailDto,
  AdminArticleListItemDto,
  AdminArticleListInput,
  AdminArticleRejectInput,
  AdminArticleRevisionCreateInput,
  AdminArticleScheduleInput,
  AdminArticleUpdateInput,
  ArticleRevisionDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取文章列表
 */
export async function getArticlesApi(params?: AdminArticleListInput) {
  return requestClient.get<PagedResultDto<AdminArticleListItemDto>>(
    '/cms/admin/articles',
    { params },
  );
}

/**
 * 根据 ID 获取文章详情
 */
export async function getArticleApi(id: string) {
  return requestClient.get<AdminArticleDetailDto>(`/cms/admin/articles/${id}`);
}

/**
 * 创建新文章
 */
export async function createArticleApi(data: AdminArticleCreateInput) {
  return requestClient.post<AdminArticleDetailDto>('/cms/admin/articles', data);
}

/**
 * 更新文章
 */
export async function updateArticleApi(id: string, data: AdminArticleUpdateInput) {
  return requestClient.put<AdminArticleDetailDto>(`/cms/admin/articles/${id}`, data);
}

/**
 * 删除文章
 */
export async function deleteArticleApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/articles/${id}`);
}

/**
 * 获取文章历史版本列表
 */
export async function getArticleRevisionsApi(id: string) {
  return requestClient.get<ArticleRevisionDto[]>(
    `/cms/admin/articles/${id}/revisions`,
  );
}

/**
 * 获取单个修订版本详情
 */
export async function getArticleRevisionApi(id: string, revisionId: string) {
  return requestClient.get<ArticleRevisionDto>(
    `/cms/admin/articles/${id}/revisions/${revisionId}`,
  );
}

/**
 * 回滚恢复至指定版本
 */
export async function rollbackArticleRevisionApi(id: string, revisionId: string) {
  return requestClient.post<ArticleRevisionDto>(
    `/cms/admin/articles/${id}/revisions/${revisionId}/rollback`,
  );
}

/**
 * 删除指定修订版本
 */
export async function deleteArticleRevisionApi(id: string, revisionId: string) {
  return requestClient.delete<void>(
    `/cms/admin/articles/${id}/revisions/${revisionId}`,
  );
}

/**
 * 创建文章新版本
 */
export async function createArticleRevisionApi(
  id: string,
  data: AdminArticleRevisionCreateInput,
) {
  return requestClient.post<ArticleRevisionDto>(
    `/cms/admin/articles/${id}/revisions`,
    data,
  );
}

/**
 * 提交审核
 */
export async function submitArticleReviewApi(id: string) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/submit-review`);
}

/**
 * 审核通过
 */
export async function approveArticleApi(id: string, opinion?: string) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/approve`, null, {
    params: { opinion },
  });
}

/**
 * 审核拒绝
 */
export async function rejectArticleApi(
  id: string,
  data: AdminArticleRejectInput,
) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/reject`, data);
}

/**
 * 定时发布
 */
export async function scheduleArticleApi(
  id: string,
  data: AdminArticleScheduleInput,
) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/schedule`, data);
}

/**
 * 立即发布
 */
export async function publishArticleApi(id: string) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/publish`);
}

/**
 * 下架文章
 */
export async function offlineArticleApi(id: string) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/offline`);
}

/**
 * 归档文章
 */
export async function archiveArticleApi(id: string) {
  return requestClient.post<void>(`/cms/admin/articles/${id}/archive`);
}

/**
 * 批量设置分类
 */
export async function batchSetArticleCategoriesApi(data: AdminArticleBatchCategoriesInput) {
  return requestClient.post<void>('/cms/admin/articles/batch/categories', data);
}

/**
 * 批量设置标签
 */
export async function batchSetArticleTagsApi(data: AdminArticleBatchTagsInput) {
  return requestClient.post<void>('/cms/admin/articles/batch/tags', data);
}

/**
 * 批量设置状态
 */
export async function batchSetArticleStatusApi(data: AdminArticleBatchStatusInput) {
  return requestClient.post<void>('/cms/admin/articles/batch/status', data);
}

/**
 * 批量发布文章
 */
export async function batchPublishArticlesApi(data: AdminArticleBatchIdsInput) {
  return requestClient.post<void>('/cms/admin/articles/batch/publish', data);
}

/**
 * 批量下架文章
 */
export async function batchOfflineArticlesApi(data: AdminArticleBatchIdsInput) {
  return requestClient.post<void>('/cms/admin/articles/batch/offline', data);
}

/**
 * 批量删除文章
 */
export async function batchDeleteArticlesApi(data: AdminArticleBatchIdsInput) {
  return requestClient.post<void>('/cms/admin/articles/batch/delete', data);
}

