import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ContentSourceDto } from '#/api/cms';

import { SourceType } from '#/api/cms';

export const sourceTypeOptions = [
  { color: 'blue', label: '手动创建', value: SourceType.Manual },
  { color: 'purple', label: '导入', value: SourceType.Import },
  { color: 'green', label: '微信公众号', value: SourceType.Wechat },
  { color: 'orange', label: '旧系统', value: SourceType.OldCms },
  { color: 'cyan', label: 'Markdown', value: SourceType.Markdown },
  { color: 'pink', label: '网络爬虫', value: SourceType.Crawler },
  { color: 'geekblue', label: '外部 API', value: SourceType.ExternalApi },
  { color: 'gold', label: 'AI 生成', value: SourceType.AI },
];

export function useColumns(
  onActionClick: OnActionClickFn<ContentSourceDto>,
): VxeTableGridColumns<ContentSourceDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'articleId',
      title: '关联文章 ID',
      width: 150,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: sourceTypeOptions,
      },
      field: 'sourceType',
      title: '来源渠道',
      width: 120,
    },
    {
      field: 'sourceSystem',
      formatter: 'formatEmpty',
      title: '来源系统名称',
      width: 140,
    },
    {
      field: 'externalId',
      formatter: 'formatEmpty',
      title: '外部业务 ID',
      width: 140,
    },
    {
      align: 'left',
      field: 'sourceUrl',
      formatter: 'formatEmpty',
      minWidth: 200,
      showOverflow: 'ellipsis',
      title: '源链接地址',
    },
    {
      field: 'importer',
      formatter: 'formatEmpty',
      title: '导入程序/人',
      width: 120,
    },
    {
      field: 'importedTime',
      formatter: 'formatDateTime',
      title: '导入时间',
      width: 160,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'externalId',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'edit', text: '编辑' },
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
