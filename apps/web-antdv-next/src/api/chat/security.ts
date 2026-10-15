import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * URL 安全级别枚举
 */
export enum UrlSecurityLevel {
  Safe = 0, // 白名单放行
  Warning = 1, // 灰名单提醒
  Blocked = 2, // 黑名单阻断
}

/**
 * URL 风险分类枚举
 */
export enum UrlRiskCategory {
  None = 0,
  OfficialOrWhitelisted = 1, // 平台官方/白名单
  UnknownThirdParty = 2, // 未认证第三方
  Fraud = 3, // 电信诈骗
  Phishing = 4, // 仿冒钓鱼
  Porn = 5, // 色情低俗
  IllegalGambling = 6, // 非法赌博
  Malware = 7, // 病毒木马
  Other = 99, // 其它违规
}

/**
 * 举报处理状态枚举
 */
export enum SecurityReportStatus {
  Pending = 0, // 待审核
  Resolved = 1, // 已确认并封禁
  Rejected = 2, // 驳回/忽略
}

/**
 * 安全规则 DTO
 */
export interface UrlSecurityRuleDto {
  category: UrlRiskCategory;
  creationTime: string;
  expireTime?: string;
  hitCount: number;
  host: string;
  id: string;
  isEnabled: boolean;
  level: UrlSecurityLevel;
  reason?: string;
}

/**
 * 安全规则列表查询参数
 */
export interface UrlSecurityRuleGetListInput
  extends PagedAndSortedResultRequestDto {
  category?: UrlRiskCategory;
  isEnabled?: boolean;
  keyword?: string;
  level?: UrlSecurityLevel;
}

/**
 * 新增安全规则入参
 */
export interface UrlSecurityRuleCreateInput {
  category: UrlRiskCategory;
  expireTime?: string;
  host: string;
  isEnabled?: boolean;
  level: UrlSecurityLevel;
  reason?: string;
}

/**
 * 修改安全规则入参
 */
export interface UrlSecurityRuleUpdateInput {
  category: UrlRiskCategory;
  expireTime?: string;
  host: string;
  isEnabled: boolean;
  level: UrlSecurityLevel;
  reason?: string;
}

/**
 * URL 安全检测入参
 */
export interface UrlCheckInput {
  url: string;
}

/**
 * URL 安全检测结果
 */
export interface UrlCheckOutput {
  category: UrlRiskCategory;
  domain: string;
  interceptReason?: string;
  level: UrlSecurityLevel;
  message?: string;
  source: string;
  url: string;
}

/**
 * 举报记录 DTO
 */
export interface SecurityReportDto {
  auditRemark?: string;
  creationTime: string;
  description?: string;
  id: string;
  messageId?: number | string;
  reason: string;
  reporterChatObjectId?: number | string;
  reporterSessionUnitId?: string;
  status: SecurityReportStatus;
  targetContent: string;
  targetType: string;
}

/**
 * 举报列表查询参数
 */
export interface SecurityReportGetListInput
  extends PagedAndSortedResultRequestDto {
  keyword?: string;
  status?: SecurityReportStatus;
  targetType?: string;
}

/**
 * 审核处理举报入参
 */
export interface SecurityReportHandleInput {
  addBlacklist?: boolean;
  auditRemark?: string;
  status: SecurityReportStatus;
}

/**
 * 分页查询 URL 安全规则列表 (GET /api/chat/security/rules)
 */
export async function getUrlSecurityRulesApi(
  params: UrlSecurityRuleGetListInput,
) {
  return requestClient.get<PagedResultDto<UrlSecurityRuleDto>>(
    '/chat/security/rules',
    { params },
  );
}

/**
 * 获取单个 URL 安全规则 (GET /api/chat/security/rule/:id)
 */
export async function getUrlSecurityRuleApi(id: string) {
  return requestClient.get<UrlSecurityRuleDto>(`/chat/security/rule/${id}`);
}

/**
 * 创建 URL 安全规则 (POST /api/chat/security/rule)
 */
export async function createUrlSecurityRuleApi(
  data: UrlSecurityRuleCreateInput,
) {
  return requestClient.post<UrlSecurityRuleDto>('/chat/security/rule', data);
}

/**
 * 更新 URL 安全规则 (PUT /api/chat/security/rule/:id)
 */
export async function updateUrlSecurityRuleApi(
  id: string,
  data: UrlSecurityRuleUpdateInput,
) {
  return requestClient.put<UrlSecurityRuleDto>(
    `/chat/security/rule/${id}`,
    data,
  );
}

/**
 * 删除 URL 安全规则 (DELETE /api/chat/security/rule/:id)
 */
export async function deleteUrlSecurityRuleApi(id: string) {
  return requestClient.delete(`/chat/security/rule/${id}`);
}

/**
 * 启停 URL 安全规则 (POST /api/chat/security/rule/:id/set-enabled)
 */
export async function setUrlSecurityRuleEnabledApi(
  id: string,
  isEnabled: boolean,
) {
  return requestClient.post(`/chat/security/rule/${id}/set-enabled`, null, {
    params: { isEnabled },
  });
}

/**
 * 刷新风控规则至 Redis 缓存 (POST /api/chat/security/refresh-cache)
 */
export async function refreshUrlSecurityCacheApi() {
  return requestClient.post('/chat/security/refresh-cache');
}

/**
 * 在线检测 URL 安全风险 (POST /api/chat/security/check-url)
 */
export async function checkUrlSecurityApi(data: UrlCheckInput) {
  return requestClient.post<UrlCheckOutput>('/chat/security/check-url', data);
}

/**
 * 分页查询用户举报记录 (GET /api/chat/security/reports)
 */
export async function getSecurityReportsApi(params: SecurityReportGetListInput) {
  return requestClient.get<PagedResultDto<SecurityReportDto>>(
    '/chat/security/reports',
    { params },
  );
}

/**
 * 审核处理用户举报 (POST /api/chat/security/report/:id/handle)
 */
export async function handleSecurityReportApi(
  id: string,
  data: SecurityReportHandleInput,
) {
  return requestClient.post<SecurityReportDto>(
    `/chat/security/report/${id}/handle`,
    data,
  );
}
