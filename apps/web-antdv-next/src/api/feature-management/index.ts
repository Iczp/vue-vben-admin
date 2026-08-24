import { requestClient } from '#/api/request';

export interface ValueValidator {
  name?: string;
  properties?: Record<string, any>;
}

export interface ValueType {
  itemSource?: {
    items?: Array<{
      displayText?: { value?: string };
      value?: string;
    }>;
  };
  name?: string;
  properties?: Record<string, any>;
  validator?: ValueValidator;
}

export interface FeatureDto {
  depth?: number;
  description?: string;
  displayName?: string;
  name: string;
  parentName?: string;
  provider?: {
    key?: string;
    name?: string;
  };
  value?: string;
  valueType?: ValueType;
}

export interface FeatureGroupDto {
  displayName?: string;
  features?: FeatureDto[];
  name: string;
}

export interface GetFeatureListResultDto {
  groups?: FeatureGroupDto[];
}

export interface UpdateFeatureDto {
  name: string;
  value: string;
}

export interface UpdateFeaturesDto {
  features: UpdateFeatureDto[];
}

/**
 * 获取指定 Provider（如租户 T）的特性列表
 */
export async function getFeaturesApi(params: {
  providerKey?: string;
  providerName: string;
}) {
  return requestClient.get<GetFeatureListResultDto>(
    '/feature-management/features',
    { params },
  );
}

/**
 * 更新特性配置
 */
export async function updateFeaturesApi(
  params: { providerKey?: string; providerName: string },
  data: UpdateFeaturesDto,
) {
  return requestClient.put<void>('/feature-management/features', data, {
    params,
  });
}
