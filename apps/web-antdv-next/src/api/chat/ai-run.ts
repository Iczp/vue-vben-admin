import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * AI 任务执行状态枚举
 * 0: Queued 排队中
 * 1: Running 执行中
 * 2: Completed 已完成
 * 3: RetryScheduled 等待重试
 * 4: Failed 执行失败
 * 5: TimedOut 执行超时
 * 6: Cancelled 已取消
 */
export enum AiRunStatus {
  Queued = 0,
  Running = 1,
  Completed = 2,
  RetryScheduled = 3,
  Failed = 4,
  TimedOut = 5,
  Cancelled = 6,
}

export interface AiRunDto {
  attemptCount: number;
  completedTime?: string;
  creationTime: string;
  creatorId?: string;
  deadlineTime?: string;
  id: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  lastHeartbeatTime?: string;
  lastModificationTime?: string;
  leaseOwner?: string;
  leaseUntilTime?: string;
  maxAttempts: number;
  nextAttemptAt?: string;
  outputMessageId?: number;
  provider: string;
  requesterSessionUnitId: string;
  sessionId: string;
  sourceMessageId: number;
  startedTime?: string;
  status: AiRunStatus;
}

export interface AiRunDetailDto extends AiRunDto {}

export interface AiRunGetListInput extends PagedAndSortedResultRequestDto {
  endCreationTime?: string;
  keyword?: string;
  leaseOwner?: string;
  outputMessageId?: number;
  provider?: string;
  requesterSessionUnitId?: string;
  sessionId?: string;
  sourceMessageId?: number;
  startCreationTime?: string;
  status?: AiRunStatus;
}

export interface AiRunCreateInput {
  maxAttempts?: number;
  provider: string;
  requesterSessionUnitId: string;
  sessionId: string;
  sourceMessageId: number;
}

export interface AiRunUpdateInput {
  maxAttempts?: number;
  nextAttemptAt?: string;
  status?: AiRunStatus;
}

/**
 * 获取 AI 任务分页列表 (GET /api/chat/admin/ai-run)
 */
export async function getAiRunListApi(params?: AiRunGetListInput) {
  return requestClient.get<PagedResultDto<AiRunDto>>('/chat/admin/ai-run', {
    params,
  });
}

/**
 * 获取 AI 任务详情 (GET /api/chat/admin/ai-run/{id})
 */
export async function getAiRunDetailApi(id: string) {
  return requestClient.get<AiRunDetailDto>(`/chat/admin/ai-run/${id}`);
}

/**
 * 根据源消息 Id 获取 AI 执行记录 (GET /api/chat/admin/ai-run/by-source-message-id/{sourceMessageId})
 */
export async function getAiRunBySourceMessageIdApi(
  sourceMessageId: number | string,
) {
  return requestClient.get<AiRunDetailDto>(
    `/chat/admin/ai-run/by-source-message-id/${sourceMessageId}`,
  );
}

/**
 * 获取指定会话的 AI 执行记录列表 (GET /api/chat/admin/ai-run/by-session/{sessionId})
 */
export async function getAiRunListBySessionApi(
  sessionId: string,
  params?: AiRunGetListInput,
) {
  return requestClient.get<PagedResultDto<AiRunDto>>(
    `/chat/admin/ai-run/by-session/${sessionId}`,
    { params },
  );
}

/**
 * 创建 AI 执行记录 (POST /api/chat/admin/ai-run)
 */
export async function createAiRunApi(data: AiRunCreateInput) {
  return requestClient.post<AiRunDetailDto>('/chat/admin/ai-run', data);
}

/**
 * 人工重试执行失败或超时的任务 (POST /api/chat/admin/ai-run/{id}/retry)
 */
export async function retryAiRunApi(id: string) {
  return requestClient.post<AiRunDetailDto>(`/chat/admin/ai-run/${id}/retry`);
}

/**
 * 取消任务 (POST /api/chat/admin/ai-run/{id}/cancel)
 */
export async function cancelAiRunApi(id: string, reason?: string) {
  return requestClient.post<AiRunDetailDto>(
    `/chat/admin/ai-run/${id}/cancel`,
    reason ? { reason } : undefined,
  );
}

/**
 * 删除一条数据 (DELETE /api/chat/admin/ai-run/{id})
 */
export async function deleteAiRunApi(id: string) {
  return requestClient.delete(`/chat/admin/ai-run/${id}`);
}

/**
 * 批量删除数据 (DELETE /api/chat/admin/ai-run/many)
 */
export async function deleteAiRunManyApi(idList: string[]) {
  return requestClient.delete('/chat/admin/ai-run/many', {
    params: { idList },
  });
}

export const deleteManyAiRunApi = deleteAiRunManyApi;
