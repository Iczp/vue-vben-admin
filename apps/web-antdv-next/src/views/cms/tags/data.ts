import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { TagDto } from '#/api/cms';

export function useColumns(
  onActionClick: OnActionClickFn<TagDto>,
): VxeTableGridColumns<TagDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'name',
      minWidth: 160,
      title: '标签名称',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'code',
      title: '标签编码',
      width: 150,
    },
    {
      field: 'sorting',
      title: '排序号',
      width: 90,
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
      width: 90,
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 200,
      showOverflow: 'ellipsis',
      title: '标签说明',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: '创建时间',
      width: 170,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'name',
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
