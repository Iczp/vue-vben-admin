import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AssetDto } from '#/api/cms';

import { AssetStatus, AssetType } from '#/api/cms';

export const assetTypeOptions = [
  { color: 'blue', label: '图片', value: AssetType.Image },
  { color: 'purple', label: '视频', value: AssetType.Video },
  { color: 'cyan', label: '音频', value: AssetType.Audio },
  { color: 'default', label: '常规文件', value: AssetType.File },
];

export const assetStatusOptions = [
  { color: 'success', label: '正常', value: AssetStatus.Normal },
  { color: 'processing', label: '处理中', value: AssetStatus.Processing },
  { color: 'error', label: '失败', value: AssetStatus.Failed },
  { color: 'default', label: '已禁用', value: AssetStatus.Disabled },
];

function formatBytes(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function useColumns(
  onActionClick: OnActionClickFn<AssetDto>,
): VxeTableGridColumns<AssetDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      cellRender: {
        name: 'CellImage',
        props: {
          height: 40,
          width: 50,
        },
      },
      field: 'sourceUrl',
      title: '缩略图',
      width: 75,
    },
    {
      align: 'left',
      field: 'fileName',
      minWidth: 200,
      showOverflow: 'ellipsis',
      title: '素材文件名',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: assetTypeOptions,
      },
      field: 'type',
      title: '类型',
      width: 90,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: assetStatusOptions,
      },
      field: 'status',
      title: '状态',
      width: 90,
    },
    {
      field: 'fileSize',
      formatter: ({ cellValue }) => formatBytes(cellValue),
      title: '文件大小',
      width: 100,
    },
    {
      field: 'mimeType',
      minWidth: 120,
      title: 'MIME 类型',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'blobName',
      minWidth: 180,
      showOverflow: 'ellipsis',
      title: 'Blob 名称',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '上传时间',
      width: 160,
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
          { code: 'copy_url', text: '复制链接' },
          {
            code: 'delete',
            props: { danger: true },
            text: '删除',
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 140,
    },
  ];
}
