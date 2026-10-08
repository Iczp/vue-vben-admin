import type { AssetCreateDto, AssetDto, AssetGetListInput } from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

import { readMediaUploadMetadata } from './media-metadata';

/**
 * 确保素材地址为相对路径（去除协议与 Host，避免数据库存储具体域名/端口）
 */
export function toRelativeAssetUrl(url: null | string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  const idx = trimmed.indexOf('/api/cms/assets/');
  if (idx !== -1) {
    return trimmed.substring(idx);
  }
  return trimmed;
}

export function resolveAssetAccessUrl(url: null | string | undefined): string {
  if (!url) return '';
  return toRelativeAssetUrl(url);
}

function withAssetUrls(asset: AssetDto): AssetDto {
  return {
    ...asset,
    url: toRelativeAssetUrl(asset.url),
    thumbnailUrl: asset.thumbnailUrl
      ? toRelativeAssetUrl(asset.thumbnailUrl)
      : null,
    variants: asset.variants?.map((variant) => ({
      ...variant,
      url: toRelativeAssetUrl(variant.url),
    })),
  };
}

/**
 * 分页获取素材列表
 */
export async function getAssetsApi(params?: AssetGetListInput) {
  const result = await requestClient.get<PagedResultDto<AssetDto>>(
    '/cms/admin/assets',
    { params },
  );
  return { ...result, items: result.items.map(withAssetUrls) };
}

/**
 * 根据 ID 获取素材详情
 */
export async function getAssetApi(id: string) {
  return withAssetUrls(
    await requestClient.get<AssetDto>(`/cms/admin/assets/${id}`),
  );
}

/**
 * 手动创建素材记录
 */
export async function createAssetApi(data: AssetCreateDto) {
  return withAssetUrls(
    await requestClient.post<AssetDto>('/cms/admin/assets', data),
  );
}

/**
 * 上传文件素材 (Multipart Form)
 */
export async function uploadAssetApi(file: File) {
  const formData = new FormData();
  formData.append('streamContent', file);
  const metadata = await readMediaUploadMetadata(file);
  for (const key of [
    'width',
    'height',
    'duration',
    'thumbnailWidth',
    'thumbnailHeight',
  ] as const) {
    if (metadata[key] != null) formData.append(key, String(metadata[key]));
  }
  if (metadata.thumbnail) formData.append('thumbnail', metadata.thumbnail);
  return withAssetUrls(
    await requestClient.post<AssetDto>('/cms/admin/assets/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  );
}

/**
 * 删除素材
 */
export async function deleteAssetApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/assets/${id}`);
}
