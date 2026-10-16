import type {
  AssetFolderCreateDto,
  AssetFolderDto,
  AssetFolderGetListInput,
  AssetFolderMoveDto,
  AssetFolderUpdateDto,
} from './types';

import type { PagedResultDto } from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 获取文件夹树结构列表
 */
export async function getAssetFolderTreeApi(params?: AssetFolderGetListInput) {
  return requestClient.get<AssetFolderDto[]>('/cms/admin/asset-folders/tree', {
    params,
  });
}

/**
 * 分页获取文件夹列表
 */
export async function getAssetFoldersApi(params?: AssetFolderGetListInput) {
  return requestClient.get<PagedResultDto<AssetFolderDto>>(
    '/cms/admin/asset-folders',
    { params },
  );
}

/**
 * 根据 ID 获取文件夹详情
 */
export async function getAssetFolderApi(id: string) {
  return requestClient.get<AssetFolderDto>(`/cms/admin/asset-folders/${id}`);
}

/**
 * 创建文件夹
 */
export async function createAssetFolderApi(data: AssetFolderCreateDto) {
  return requestClient.post<AssetFolderDto>('/cms/admin/asset-folders', data);
}

/**
 * 更新文件夹
 */
export async function updateAssetFolderApi(
  id: string,
  data: AssetFolderUpdateDto,
) {
  return requestClient.put<AssetFolderDto>(
    `/cms/admin/asset-folders/${id}`,
    data,
  );
}

/**
 * 移动文件夹位置 (变更父级)
 */
export async function moveAssetFolderApi(id: string, data: AssetFolderMoveDto) {
  return requestClient.post<AssetFolderDto>(
    `/cms/admin/asset-folders/${id}/move`,
    data,
  );
}

/**
 * 直接删除文件夹（存在素材或子文件夹时后端将拦截抛错）
 */
export async function deleteAssetFolderApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/asset-folders/${id}`);
}

/**
 * 删除文件夹并将其中素材自动移至父级
 */
export async function deleteAssetFolderAndMoveAssetsToParentApi(id: string) {
  return requestClient.delete<void>(
    `/cms/admin/asset-folders/${id}/move-to-parent`,
  );
}
