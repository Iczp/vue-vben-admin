import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ChatObjectCategoryDto, ChatObjectTypeDto } from '#/api/chat';

/**
 * 分类列表列定义
 */
export function useCategoryColumns(
  onActionClick: OnActionClickFn<ChatObjectCategoryDto>,
): VxeTableGridColumns<ChatObjectCategoryDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'name',
      minWidth: 160,
      title: '分类名称',
      treeNode: true,
    },
    {
      field: 'depth',
      minWidth: 80,
      title: '层级深度',
    },
    {
      field: 'sorting',
      minWidth: 80,
      title: '排序号',
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 180,
      title: '描述',
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      minWidth: 165,
      title: '创建时间',
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
      width: 200,
    },
  ];
}

/**
 * 对象类型列表列定义
 */
export function useTypeColumns(
  onActionClick: OnActionClickFn<ChatObjectTypeDto>,
): VxeTableGridColumns<ChatObjectTypeDto> {
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
      minWidth: 140,
      title: '类型标识 (ID)',
    },
    {
      field: 'name',
      minWidth: 140,
      title: '类型名称',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'green', label: '允许子级', value: true },
          { color: 'default', label: '无子级', value: false },
        ],
      },
      field: 'isHasChild',
      title: '是否有子级',
      width: 110,
    },
    {
      field: 'maxDepth',
      title: '最大层级深度',
      width: 120,
    },
    {
      field: 'chatObjectCount',
      title: '关联对象数',
      width: 110,
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 160,
      title: '说明',
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
      width: 130,
    },
  ];
}
