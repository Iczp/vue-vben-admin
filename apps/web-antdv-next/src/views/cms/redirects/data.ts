import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ContentRedirectDto } from '#/api/cms';

export function useColumns(
  onActionClick: OnActionClickFn<ContentRedirectDto>,
): VxeTableGridColumns<ContentRedirectDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      align: 'left',
      field: 'sourcePath',
      minWidth: 200,
      title: '原始请求路径 (SourcePath)',
    },
    {
      field: 'targetCode',
      title: '目标文章短代码',
      width: 140,
    },
    {
      field: 'entityType',
      title: '目标实体',
      width: 100,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'entityId',
      title: '实体 ID',
      width: 150,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'blue', label: '301 永久重定向', value: 301 },
          { color: 'orange', label: '302 临时重定向', value: 302 },
        ],
      },
      field: 'httpStatusCode',
      title: '跳转状态码',
      width: 130,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'default', label: '停用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 80,
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 160,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'sourcePath',
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
