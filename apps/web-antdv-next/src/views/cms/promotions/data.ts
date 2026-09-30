import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { ContentPromotionDto } from '#/api/cms';

export function useColumns(
  onActionClick: OnActionClickFn<ContentPromotionDto>,
): VxeTableGridColumns<ContentPromotionDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'entityType',
      title: '推广实体',
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
      field: 'scene',
      minWidth: 120,
      title: '推广场景',
    },
    {
      field: 'weight',
      title: '提权比重',
      width: 90,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '投放中', value: true },
          { color: 'default', label: '已下线', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 90,
    },
    {
      field: 'startTime',
      formatter: 'formatDateTime',
      title: '起始生效时间',
      width: 160,
    },
    {
      field: 'endTime',
      formatter: 'formatDateTime',
      title: '截止结束时间',
      width: 160,
    },
    {
      field: 'reason',
      formatter: 'formatEmpty',
      minWidth: 160,
      showOverflow: 'tooltip',
      title: '推广事由 / 批注',
    },
    {
      field: 'operatorActorName',
      formatter: 'formatEmpty',
      title: '操作人',
      width: 110,
    },
    {
      cellRender: {
        attrs: {
          nameField: 'entityId',
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
