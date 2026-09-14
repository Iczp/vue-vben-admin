import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { BlobDto } from '#/api/chat/blob';

import { $t } from '#/locales';

/**
 * 格式化文件大小
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function useColumns(
  onActionClick: OnActionClickFn<BlobDto>,
): VxeTableGridColumns<BlobDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'id',
      minWidth: 160,
      title: '对象 ID (UUID)',
    },
    {
      field: 'fileName',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '原始文件名',
    },
    {
      field: 'container',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: '存储容器 (Container)',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '图片', value: 'image' },
          { color: 'purple', label: '音视频', value: 'video' },
          { color: 'orange', label: '压缩包', value: 'archive' },
          { color: 'default', label: '其它', value: 'other' },
        ],
      },
      field: 'suffix',
      title: '后缀',
      width: 90,
    },
    {
      field: 'fileSize',
      formatter: ({ cellValue }) => formatBytes(cellValue),
      title: '文件大小',
      width: 110,
    },
    {
      field: 'mimeType',
      formatter: 'formatEmpty',
      minWidth: 140,
      title: 'MIME 类型',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '公开', value: true },
          { color: 'default', label: '私有', value: false },
        ],
      },
      field: 'isPublic',
      title: '公开访问',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'cyan', label: '静态资源', value: true },
          { color: 'default', label: '普通', value: false },
        ],
      },
      field: 'isStatic',
      title: '静态托管',
      width: 100,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'fileName',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'detail', text: '详情' },
          { code: 'edit', text: $t('common.edit', '编辑') },
          { code: 'delete', text: $t('common.delete', '删除') },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('common.action', '操作'),
      width: 160,
    },
  ];
}
