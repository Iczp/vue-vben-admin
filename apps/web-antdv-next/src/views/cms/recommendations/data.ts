import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { RecommendationRuleDto } from '#/api/cms';

export function useColumns(
  onActionClick: OnActionClickFn<RecommendationRuleDto>,
): VxeTableGridColumns<RecommendationRuleDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'name',
      minWidth: 150,
      title: '规则名称',
    },
    {
      field: 'scene',
      minWidth: 120,
      title: '应用场景',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '生效中', value: true },
          { color: 'default', label: '已停用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 90,
    },
    {
      field: 'freshnessWeight',
      title: '时效权重',
      width: 90,
    },
    {
      field: 'similarityWeight',
      title: '相似度权重',
      width: 100,
    },
    {
      field: 'interestWeight',
      title: '兴趣权重',
      width: 90,
    },
    {
      field: 'popularityWeight',
      title: '热度权重',
      width: 90,
    },
    {
      field: 'manualWeight',
      title: '人工加权',
      width: 90,
    },
    {
      field: 'readPenalty',
      title: '已读降权',
      width: 90,
    },
    {
      field: 'candidateCount',
      title: '候选池',
      width: 80,
    },
    {
      field: 'resultCount',
      title: '输出数',
      width: 80,
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
