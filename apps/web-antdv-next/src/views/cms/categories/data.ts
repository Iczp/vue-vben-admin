import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { CategoryDto } from '#/api/cms';

export function useColumns(
  onActionClick: OnActionClickFn<CategoryDto>,
): VxeTableGridColumns<CategoryDto> {
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
          height: 35,
          width: 35,
        },
      },
      field: 'coverUrl',
      title: '图标',
      width: 65,
    },
    {
      align: 'left',
      field: 'name',
      minWidth: 200,
      title: '分类名称',
      treeNode: true,
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'code',
      title: '分类编码',
      width: 140,
    },
    {
      field: 'slug',
      title: 'URL别名',
      width: 130,
    },
    {
      field: 'articleCount',
      title: '文章总数',
      width: 90,
    },
    {
      field: 'sorting',
      title: '排序号',
      width: 80,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'default', label: '停用', value: false },
        ],
      },
      field: 'isActive',
      title: '状态',
      width: 80,
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 160,
      showOverflow: 'ellipsis',
      title: '分类描述',
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
          nameField: 'name',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          { code: 'add_child', text: '添加子分类' },
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
      width: 190,
    },
  ];
}
