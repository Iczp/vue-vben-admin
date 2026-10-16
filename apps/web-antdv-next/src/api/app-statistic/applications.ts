import { requestClient } from '#/api/request';

export interface StatisticApplicationDto {
  id?: string;
  appId: string;
  name: string;
  description?: string;
  timeZone: string;
  isEnabled?: boolean;
  creationTime?: string;
  today: string;
}

export interface CreateStatisticApplicationInput {
  appId: string;
  name: string;
  description?: string;
  timeZone?: string;
  isEnabled?: boolean;
}

export interface UpdateStatisticApplicationInput {
  name: string;
  description?: string;
  timeZone?: string;
  isEnabled?: boolean;
}

/**
 * 获取所有统计应用列表
 */
export function getStatisticApplicationsApi() {
  return requestClient.get<StatisticApplicationDto[]>(
    '/app-statistic/admin/applications',
  );
}

/**
 * 获取单个应用详情
 */
export function getStatisticApplicationApi(id: string) {
  return requestClient.get<StatisticApplicationDto>(
    `/app-statistic/admin/applications/${id}`,
  );
}

/**
 * 创建新应用
 */
export function createStatisticApplicationApi(
  data: CreateStatisticApplicationInput,
) {
  return requestClient.post<StatisticApplicationDto>(
    '/app-statistic/admin/applications',
    data,
  );
}

/**
 * 更新应用信息（名称、时区、描述等）
 */
export function updateStatisticApplicationApi(
  id: string,
  data: UpdateStatisticApplicationInput,
) {
  return requestClient.put<StatisticApplicationDto>(
    `/app-statistic/admin/applications/${id}`,
    data,
  );
}

/**
 * 删除应用
 */
export function deleteStatisticApplicationApi(id: string) {
  return requestClient.delete<void>(`/app-statistic/admin/applications/${id}`);
}
