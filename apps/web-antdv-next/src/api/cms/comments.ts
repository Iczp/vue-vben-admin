import type { PagedResultDto } from '#/api/abp/types';
import type {
  AdminCommentListInput,
  CommentDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取评论列表
 */
export async function getCommentsApi(params?: AdminCommentListInput) {
  return requestClient.get<PagedResultDto<CommentDto>>('/cms/admin/comments', {
    params,
  });
}

/**
 * 根据 ID 获取评论详情
 */
export async function getCommentApi(id: string) {
  return requestClient.get<CommentDto>(`/cms/admin/comments/${id}`);
}

/**
 * 审核通过评论
 */
export async function approveCommentApi(id: string) {
  return requestClient.post<void>(`/cms/admin/comments/${id}/approve`);
}

/**
 * 审核拒绝评论
 */
export async function rejectCommentApi(id: string) {
  return requestClient.post<void>(`/cms/admin/comments/${id}/reject`);
}

/**
 * 隐藏评论
 */
export async function hideCommentApi(id: string) {
  return requestClient.post<void>(`/cms/admin/comments/${id}/hide`);
}

/**
 * 删除评论
 */
export async function deleteCommentApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/comments/${id}`);
}
