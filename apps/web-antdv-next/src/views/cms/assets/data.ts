import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AssetDto } from '#/api/cms';

import { AssetStatus, AssetType } from '#/api/cms';

import { formatMediaDuration, mediaDimensions } from '../components/media';

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
      align: 'center',
      cellRender: {
        name: 'CellImage',
        props: {
          height: 42,
          width: 64,
        },
      },
      field: 'previewUrl',
      title: '缩略图',
      width: 85,
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
      align: 'center',
      cellRender: {
        attrs: {
          onClick: ({ row }: any) => {
            onActionClick({ code: 'references', row });
          },
        },
        name: 'CellLink',
        props: {
          text: (row: any) => {
            const count = Number(row?.referenceCount ?? 0);
            return count > 0 ? `${count} 次` : '0 次';
          },
        },
      },
      field: 'referenceCount',
      title: '引用次数',
      width: 100,
    },
    {
      field: 'fileSize',
      formatter: ({ cellValue }) => formatBytes(cellValue),
      title: '文件大小',
      width: 100,
    },
    {
      field: 'dimensions',
      title: '宽 × 高',
      width: 130,
      formatter: ({ row }) => mediaDimensions(row),
    },
    {
      field: 'duration',
      title: '时长',
      width: 100,
      formatter: ({ row }) =>
        row.type === AssetType.Video || row.type === AssetType.Audio
          ? formatMediaDuration(row.duration)
          : '—',
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
          { code: 'preview', text: '预览详情' },
          { code: 'references', text: '引用关系' },
          {
            code: 'set_thumbnail',
            show: (rowOrParams: any) => {
              const row = rowOrParams?.row ?? rowOrParams;
              return row?.type === AssetType.Video;
            },
            text: '设置封面',
          },
          { code: 'edit_status', text: '修改状态' },
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
      width: 290,
    },
  ];
}
