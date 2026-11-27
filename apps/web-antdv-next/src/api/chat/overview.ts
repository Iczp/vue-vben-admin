import { requestClient } from '#/api/request';

export interface ChatOverviewSummaryDto {
  activeChatObjectCount: number;
  blobCount: number;
  chatObjectCount: number;
  failedAiRunCount: number;
  messageCount: number;
  observedAt: string;
  onlineConnectionCount: number;
  pendingSecurityReportCount: number;
  runningAiRunCount: number;
  sessionCount: number;
  templateCount: number;
  totalSecurityReportCount: number;
}

export function getChatOverviewSummaryApi() {
  return requestClient.get<ChatOverviewSummaryDto>(
    '/chat/admin/overview/summary',
  );
}
