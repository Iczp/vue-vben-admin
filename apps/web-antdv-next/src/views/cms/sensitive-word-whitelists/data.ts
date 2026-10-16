import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SensitiveWordWhitelistDto } from '#/api/cms';

import { sceneOptions } from '../sensitive-words/data';

export function useColumns(
  onActionClick: OnActionClickFn<SensitiveWordWhitelistDto>,
): VxeTableGridColumns<SensitiveWordWhitelistDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 55,
    },
    {
      field: 'text',
      minWidth: 200,
      title: '加白文本 / 术语',
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          ...sceneOptions,
          { color: 'default', label: '全局通用', value: undefined as any },
        ],
      },
      field: 'scene',
      title: '生效业务场景',
      width: 170,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: '启用', value: true },
          { color: 'default', label: '禁用', value: false },
        ],
      },
      field: 'isEnabled',
      title: '状态',
      width: 90,
    },
    {
      field: 'remark',
      formatter: 'formatEmpty',
      minWidth: 200,
      showOverflow: 'ellipsis',
      title: '加白原因与说明',
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
          nameField: 'text',
          onClick: onActionClick,
          usePopconfirm: false,
        },
        name: 'CellOperation',
        options: [
          {
            code: 'toggle',
            text: (row: SensitiveWordWhitelistDto) =>
              row.isEnabled ? '禁用' : '启用',
          },
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
      width: 170,
    },
  ];
}
