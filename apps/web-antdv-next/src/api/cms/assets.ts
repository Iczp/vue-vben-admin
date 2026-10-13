import type { AssetCreateDto, AssetDto, AssetGetListInput } from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

import {
  createThumbnailFromImageUrl,
  readMediaUploadMetadata,
} from './media-metadata';
import { AssetType } from './types';

const memoryThumbnailCache = new Map<string, string>();
const generatingAssetIds = new Set<string>();

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
  const thumb = asset.thumbnailUrl
    ? toRelativeAssetUrl(asset.thumbnailUrl)
    : memoryThumbnailCache.get(asset.id) || null;
  return {
    ...asset,
    url: toRelativeAssetUrl(asset.url),
    thumbnailUrl: thumb,
    variants: asset.variants?.map((variant) => ({
      ...variant,
      url: toRelativeAssetUrl(variant.url),
    })),
  };
}

/**
 * 针对历史未生成缩略图的图片素材，后台低并发生成轻量缩略图并自动回写服务端，避免列表直接渲染大图卡顿
 */
export function ensureImageAssetThumbnails(
  assets: AssetDto[],
  onThumbReady?: (assetId: string, thumbnailUrl: string) => void,
) {
  const missing = assets.filter(
    (a) =>
      a.type === AssetType.Image &&
      !a.thumbnailUrl &&
      Boolean(a.url) &&
      !generatingAssetIds.has(a.id),
  );
  if (missing.length === 0) return;

  void (async () => {
    for (const asset of missing) {
      if (generatingAssetIds.has(asset.id)) continue;
      generatingAssetIds.add(asset.id);
      try {
        const thumb = await createThumbnailFromImageUrl(asset.url, 360);
        memoryThumbnailCache.set(asset.id, thumb.blobUrl);
        asset.thumbnailUrl = thumb.blobUrl;
        onThumbReady?.(asset.id, thumb.blobUrl);
        // 异步持久化到后端，下次直接返回服务端 thumbnailUrl
        void setAssetThumbnailApi(
          asset.id,
          thumb.file,
          thumb.width,
          thumb.height,
        ).catch(() => {});
      } catch {
        // 若跨域或图片异常无法 canvas 转换，才兜底用原图链接
        asset.thumbnailUrl = asset.url;
        onThumbReady?.(asset.id, asset.url);
      }
    }
  })();
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
export async function uploadAssetApi(
  file: File,
  customThumbnail?: File,
  folderId?: string,
  scope?: import('./types').AssetScope,
) {
  const formData = new FormData();
  formData.append('streamContent', file);
  if (folderId) formData.append('folderId', folderId);
  if (scope !== undefined) formData.append('scope', String(scope));

  const metadata = await readMediaUploadMetadata(file, customThumbnail);
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
      params: {
        folderId: folderId || undefined,
        scope,
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

/**
 * 设置/更新素材缩略图 (封面)
 */
export async function setAssetThumbnailApi(
  id: string,
  thumbnail: File,
  width?: number,
  height?: number,
) {
  const formData = new FormData();
  formData.append('thumbnail', thumbnail);
  const params: Record<string, any> = {};
  if (width != null) params.width = width;
  if (height != null) params.height = height;

  return withAssetUrls(
    await requestClient.post<AssetDto>(
      `/cms/admin/assets/${id}/thumbnail`,
      formData,
      {
        params,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    ),
  );
}

/**
 * 获取素材被引用列表
 */
export async function getAssetReferencesApi(id: string) {
  return requestClient.get<import('./types').AssetReferenceDto[]>(
    `/cms/admin/assets/${id}/references`,
  );
}

/**
 * 更新素材状态（正常/处理中/失败/已禁用）
 */
export async function updateAssetStatusApi(
  id: string,
  data: import('./types').AssetStatusUpdateDto,
) {
  return withAssetUrls(
    await requestClient.put<AssetDto>(`/cms/admin/assets/${id}/status`, data),
  );
}

/**
 * 重命名素材显示名
 */
export async function renameAssetApi(
  id: string,
  data: import('./types').AssetRenameDto,
) {
  return withAssetUrls(
    await requestClient.put<AssetDto>(`/cms/admin/assets/${id}/rename`, data),
  );
}

/**
 * 批量移动素材至目标文件夹
 */
export async function batchMoveAssetsApi(
  data: import('./types').AssetBatchMoveDto,
) {
  return requestClient.post<number>('/cms/admin/assets/batch-move', data);
}

/**
 * 批量删除素材（自动跳过已被引用的素材）
 */
export async function batchDeleteAssetsApi(
  data: import('./types').AssetBatchDeleteInput,
) {
  return requestClient.post<import('./types').AssetBatchDeleteResultDto>(
    '/cms/admin/assets/batch-delete',
    data,
  );
}

