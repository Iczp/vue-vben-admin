import type { AssetDto } from '#/api/cms';

import { AssetType } from '../../../api/cms/types';

export const mediaTypes = [
  { label: '图片', value: AssetType.Image },
  { label: '视频', value: AssetType.Video },
  { label: '音频', value: AssetType.Audio },
  { label: '文件', value: AssetType.File },
];
export function formatMediaSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '未知';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / 1024 ** index).toFixed(index ? 2 : 0)} ${units[index]}`;
}
export function formatMediaDuration(seconds?: null | number): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0)
    return '未采集';
  const value = Math.floor(seconds);
  const parts = [
    Math.floor(value / 3600),
    Math.floor(value / 60) % 60,
    value % 60,
  ];
  return (parts[0] ? parts : parts.slice(1))
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}
export function mediaDimensions(
  asset: Pick<AssetDto, 'height' | 'width'>,
): string {
  return asset.width && asset.height
    ? `${asset.width} × ${asset.height} px`
    : '未采集';
}
export function selectionLimit(multiple: boolean, maxCount: number): number {
  return multiple
    ? Math.max(1, Math.floor(Number.isFinite(maxCount) ? maxCount : 20))
    : 1;
}
export function toggleMediaSelection(
  urls: string[],
  url: string,
  multiple: boolean,
  maxCount: number,
): string[] {
  if (!multiple) return [url];
  if (urls.includes(url)) return urls.filter((value) => value !== url);
  return urls.length >= selectionLimit(multiple, maxCount)
    ? urls
    : [...urls, url];
}
