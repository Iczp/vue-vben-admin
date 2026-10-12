import type { PagedResultDto } from '#/api/abp/types';
import type {
  SensitiveWordRuleActivationDto,
  SensitiveWordRulePreviewDto,
  SensitiveWordRulePublishInput,
  SensitiveWordRuleRollbackInput,
  SensitiveWordRuleVersionDetailDto,
  SensitiveWordRuleVersionDto,
  SensitiveWordRuleVersionGetListInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取规则版本列表
 */
export async function getSensitiveWordRuleVersionsApi(
  params?: SensitiveWordRuleVersionGetListInput,
) {
  return requestClient.get<PagedResultDto<SensitiveWordRuleVersionDto>>(
    '/cms/admin/sensitive-word-rule-versions',
    { params },
  );
}

/**
 * 获取单个版本详情
 */
export async function getSensitiveWordRuleVersionApi(id: string) {
  return requestClient.get<SensitiveWordRuleVersionDetailDto>(
    `/cms/admin/sensitive-word-rule-versions/${id}`,
  );
}

/**
 * 预览当前草稿状态（词量、Hash、是否有未发布改动）
 */
export async function previewSensitiveWordRuleVersionApi() {
  return requestClient.get<SensitiveWordRulePreviewDto>(
    '/cms/admin/sensitive-word-rule-versions/preview',
  );
}

/**
 * 发布新版本
 */
export async function publishSensitiveWordRuleVersionApi(
  data: SensitiveWordRulePublishInput,
) {
  return requestClient.post<SensitiveWordRuleVersionDto>(
    '/cms/admin/sensitive-word-rule-versions/publish',
    data,
  );
}

/**
 * 回滚到指定历史版本
 */
export async function rollbackSensitiveWordRuleVersionApi(
  id: string,
  data: SensitiveWordRuleRollbackInput,
) {
  return requestClient.post<SensitiveWordRuleVersionDto>(
    `/cms/admin/sensitive-word-rule-versions/${id}/rollback`,
    data,
  );
}

/**
 * 获取版本激活审计流水
 */
export async function getSensitiveWordRuleActivationsApi() {
  return requestClient.get<SensitiveWordRuleActivationDto[]>(
    '/cms/admin/sensitive-word-rule-versions/activations',
  );
}
