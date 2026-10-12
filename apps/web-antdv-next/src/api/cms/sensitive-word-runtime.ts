import type { SensitiveWordRuntimeDto } from './types';

import { requestClient } from '#/api/request';

/**
 * 获取集群及当前节点敏感词运行时汇总状态
 */
export async function getSensitiveWordRuntimeApi() {
  return requestClient.get<SensitiveWordRuntimeDto>(
    '/cms/admin/sensitive-word-runtime',
  );
}

/**
 * 手动触发重新加载当前租户已发布的规则版本
 */
export async function reloadSensitiveWordRuntimeApi() {
  return requestClient.post<void>(
    '/cms/admin/sensitive-word-runtime/reload',
  );
}
