/**
 * AppStatistic TypeScript DTO definitions
 */

export interface PagedResultDto<T> {
  totalCount: number;
  items: T[];
}

export interface AppStatisticQueryInput {
  appId?: string;
  startDate: string;
  endDate: string;
  manufacturer?: string;
  platform?: string;
  appVersion?: string;
  channel?: string;
}

export interface OverviewDto {
  hasData: boolean;
  appId: string;
  date: string;
  todayActiveDevices: number;
  todaySessionCount: number;
  todayUniqueVisitorCount: number;
  todayDau: number;
  yesterdayDau: number;
  todayNewUsers: number;
  yesterdayNewUsers: number;
  todayNewDevices: number;
  yesterdayNewDevices: number;
  todayLaunchCount: number;
  todayPageViewCount: number;
  todayAverageDurationSeconds: number;
}

export interface StatisticTrendDto {
  date: string;
  metric: string;
  value: number;
}

export interface DimensionStatisticDto {
  newDevices?: null | number;
  launchCount?: null | number;
  newUsers?: null | number;
  firstSeenDate?: string;
  lastActiveDate?: string;
  dimension: string;
  value: string;
  activeUsers: number;
  activeDevices: number;
  eventCount: number;
  percentage: number;
}

export interface RetentionDto {
  id: string;
  appId: string;
  cohortDate: string;
  retentionDay: number;
  baseUsers: number;
  retainedUsers: number;
  retentionRate: number;
}

export interface AppStatisticDashboardDto {
  summary: OverviewDto;
  trends: StatisticTrendDto[];
  platforms: DimensionStatisticDto[];
  versions: DimensionStatisticDto[];
  retention: RetentionDto[];
}

export interface LaunchDistributionDto {
  range: string;
  userCount: number;
  percentage: number;
}

export interface DurationDistributionDto {
  range: string;
  userCount: number;
  percentage: number;
}

export interface ActivityAnalysisDto {
  hasRollingMetrics: boolean;
  dau: number;
  wau: number;
  mau: number;
  dauMauRatio: number;
  avgLaunchCountPerUser: number;
  avgDurationSecondsPerUser: number;
  trends: StatisticTrendDto[];
  launchDistributions: LaunchDistributionDto[];
  durationDistributions: DurationDistributionDto[];
}

export interface DeviceAnalysisDto {
  totalDevices: number;
  activeDevices: number;
  newDevices: number;
  monthlyActiveDevices: number;
  platforms: DimensionStatisticDto[];
  manufacturers: DimensionStatisticDto[];
  models: DimensionStatisticDto[];
  osVersions: DimensionStatisticDto[];
}

export interface VersionAnalysisDto {
  latestVersion?: string;
  activeVersionCount: number;
  latestVersionShare: number;
  legacyVersionActiveDevices: number;
  versions: DimensionStatisticDto[];
  versionTrends: StatisticTrendDto[];
}

export interface ChannelAnalysisDto {
  channels: DimensionStatisticDto[];
  newTrends: StatisticTrendDto[];
  activeTrends: StatisticTrendDto[];
}

export interface PageStatisticDto {
  pageKey: string;
  pageName?: string;
  pageViewCount: number;
  uniqueVisitorCount: number;
  avgVisitsPerUser: number;
  avgDurationSeconds?: null | number;
  percentage: number;
}

export interface PageAnalysisDto {
  totalPageViewCount: number;
  totalUniqueVisitors: number;
  pages: PageStatisticDto[];
}

export interface DeviceDto {
  id: string;
  appId: string;
  deviceKey: string;
  lastUserId?: string;
  platform?: string;
  manufacturer?: string;
  model?: string;
  osName?: string;
  osVersion?: string;
  appVersion?: string;
  channel?: string;
  language?: string;
  timeZone?: string;
  firstSeenTime: string;
  lastSeenTime: string;
  lastLoginTime?: string;
  extraPropertiesJson?: string;
}

export interface GetDevicesInput {
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  appId?: string;
  deviceKey?: string;
  platform?: string;
  appVersion?: string;
  channel?: string;
  minLastSeenTime?: string;
  maxLastSeenTime?: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface DeviceDetailDto {
  device: DeviceDto;
  recent30DaysTrends: StatisticTrendDto[];
  recentEvents: EventDto[];
  recentSessions: StatisticSessionDto[];
}

export interface EventDto {
  id: string;
  eventId: string;
  appId: string;
  eventName: string;
  deviceId?: string;
  userId?: string;
  sessionId?: string;
  eventTime: string;
  receivedTime: string;
  page?: string;
  platform?: string;
  appVersion?: string;
  osVersion?: string;
  channel?: string;
  properties?: string;
}

export interface GetEventsInput {
  appId?: string;
  eventName?: string;
  userId?: string;
  deviceId?: string;
  sessionId?: string;
  page?: string;
  platform?: string;
  appVersion?: string;
  channel?: string;
  startTime?: string;
  endTime?: string;
  skipCount?: number;
  maxResultCount?: number;
  sorting?: string;
}

export interface RebuildDailyDataInput {
  appId: string;
  date: string;
}

export interface StatisticSessionDto {
  sessionId: string;
  userId?: string;
  startTime: string;
  endTime?: string;
  durationSeconds: number;
  isCompleted: boolean;
}
