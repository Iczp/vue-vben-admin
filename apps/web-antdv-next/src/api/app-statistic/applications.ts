import { requestClient } from '#/api/request';
export interface StatisticApplicationDto { appId: string; name: string; timeZone: string; today: string }
export function getStatisticApplicationsApi() {
  return requestClient.get<StatisticApplicationDto[]>('/app-statistic/admin/applications');
}
