import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { EntryValueDto } from '#/api/chat';

/**
 * 字典项表格列定义
 */
export function useValueColumns(
  onActionClick: OnActionClickFn<EntryValueDto>,
): VxeTableGridColumns<EntryValueDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 60,
    },
    {
      field: 'name',
      minWidth: 140,
      title: '字典项标签 (Name)',
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'value',
      minWidth: 140,
      title: '字典项值 (Value)',
    },
    {
      field: 'sorting',
      title: '排序号',
      width: 90,
    },
    {
      field: 'description',
      formatter: 'formatEmpty',
      minWidth: 160,
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
