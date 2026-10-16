import type {
  MappingProfileValidateResultDto,
  SensitiveWordMappingProfileCreateInput,
  SensitiveWordMappingProfileDetailDto,
  SensitiveWordMappingProfileDto,
  SensitiveWordMappingProfileGetListInput,
  SensitiveWordMappingProfileUpdateInput,
} from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 分页获取外部分类映射配置列表
 */
export async function getSensitiveWordMappingProfilesApi(
  params?: SensitiveWordMappingProfileGetListInput,
) {
  return requestClient.get<PagedResultDto<SensitiveWordMappingProfileDto>>(
    '/cms/admin/sensitive-word-mapping-profiles',
    { params },
  );
}

/**
 * 获取单个分类映射配置详情
 */
export async function getSensitiveWordMappingProfileApi(id: string) {
  return requestClient.get<SensitiveWordMappingProfileDetailDto>(
    `/cms/admin/sensitive-word-mapping-profiles/${id}`,
  );
}

/**
 * 创建分类映射配置
 */
export async function createSensitiveWordMappingProfileApi(
  data: SensitiveWordMappingProfileCreateInput,
) {
  return requestClient.post<SensitiveWordMappingProfileDetailDto>(
    '/cms/admin/sensitive-word-mapping-profiles',
    data,
  );
}

/**
 * 更新分类映射配置
 */
export async function updateSensitiveWordMappingProfileApi(
  id: string,
  data: SensitiveWordMappingProfileUpdateInput,
) {
  return requestClient.put<SensitiveWordMappingProfileDetailDto>(
    `/cms/admin/sensitive-word-mapping-profiles/${id}`,
    data,
  );
}

/**
 * 删除分类映射配置
 */
export async function deleteSensitiveWordMappingProfileApi(id: string) {
  return requestClient.delete<void>(
    `/cms/admin/sensitive-word-mapping-profiles/${id}`,
  );
}

/**
 * 校验分类映射 JSON 语法与有效性
 */
export async function validateSensitiveWordMappingProfileApi(id: string) {
  return requestClient.post<MappingProfileValidateResultDto>(
    `/cms/admin/sensitive-word-mapping-profiles/${id}/validate`,
  );
}
