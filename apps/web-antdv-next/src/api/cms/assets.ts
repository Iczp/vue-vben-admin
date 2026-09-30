import type { PagedResultDto } from '#/api/abp/types';
import type {
  AssetCreateDto,
  AssetDto,
  AssetGetListInput,
} from './types';

import { requestClient } from '#/api/request';

/**
 * 分页获取素材列表
 */
export async function getAssetsApi(params?: AssetGetListInput) {
  return requestClient.get<PagedResultDto<AssetDto>>('/cms/admin/assets', {
    params,
  });
}

/**
 * 根据 ID 获取素材详情
 */
export async function getAssetApi(id: string) {
  return requestClient.get<AssetDto>(`/cms/admin/assets/${id}`);
}

/**
 * 手动创建素材记录
 */
export async function createAssetApi(data: AssetCreateDto) {
  return requestClient.post<AssetDto>('/cms/admin/assets', data);
}

/**
 * 上传文件素材 (Multipart Form)
 */
export async function uploadAssetApi(file: File) {
  const formData = new FormData();
  formData.append('streamContent', file);
  formData.append('file', file);
  return requestClient.post<AssetDto>('/cms/admin/assets/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 删除素材
 */
export async function deleteAssetApi(id: string) {
  return requestClient.delete<void>(`/cms/admin/assets/${id}`);
}
