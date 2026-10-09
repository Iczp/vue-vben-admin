import type {
  ModerationRuleTestInput,
  ModerationRuleTestResultDto,
  SensitiveWordRuntimeStateDto,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 实时在线测试敏感词风控规则
 */
export async function testModerationRuleApi(data: ModerationRuleTestInput) {
  return requestClient.post<ModerationRuleTestResultDto>(
    '/cms/admin/moderation/local-rules/test',
    data,
  );
}

/**
 * 获取当前节点敏感词引擎运行时状态
 */
export async function getModerationRuleRuntimeStateApi() {
  return requestClient.get<SensitiveWordRuntimeStateDto>(
    '/cms/admin/moderation/local-rules/runtime-state',
  );
}

/**
 * 手动强制刷新重载敏感词内存快照
 */
export async function reloadModerationRulesApi() {
  return requestClient.post<void>(
    '/cms/admin/moderation/local-rules/reload',
  );
}
