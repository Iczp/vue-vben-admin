import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { IdentityRoleDto } from '#/api/identity';

import { h } from 'vue';

import { Tag } from 'antdv-next';

import { $t } from '#/locales';

export function useColumns(
  onActionClick: (params: { code: string; row: IdentityRoleDto }) => void,
): VxeGridPropTypes.Columns<IdentityRoleDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'name',
      minWidth: 150,
      title: $t('page.identity.role.name', '角色名称'),
    },
    {
      field: 'isDefault',
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: row.isDefault ? 'success' : 'default' },
            () =>
              row.isDefault
                ? $t('common.yes', '是')
                : $t('common.no', '否'),
          );
        },
      },
      title: $t('page.identity.role.isDefault', '默认角色'),
      width: 100,
    },
    {
      field: 'isPublic',
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: row.isPublic ? 'blue' : 'default' },
            () =>
              row.isPublic
                ? $t('common.yes', '是')
                : $t('common.no', '否'),
          );
        },
      },
      title: $t('page.identity.role.isPublic', '公共角色'),
      width: 100,
    },
    {
      field: 'isStatic',
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: row.isStatic ? 'purple' : 'default' },
            () =>
              row.isStatic
                ? $t('page.identity.role.static', '系统静态')
                : $t('page.identity.role.custom', '自定义'),
          );
        },
      },
      title: $t('page.identity.role.type', '类型'),
      width: 110,
    },
    {
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          return h('div', { class: 'flex items-center justify-center gap-2' }, [
            h(
              'a',
              {
                class: 'text-primary hover:underline cursor-pointer',
                onClick: () => onActionClick({ code: 'edit', row }),
              },
              $t('common.edit', '编辑'),
            ),
            h(
              'a',
              {
                class: 'text-primary hover:underline cursor-pointer',
                onClick: () => onActionClick({ code: 'permission', row }),
              },
              $t('page.permission.title', '权限'),
            ),
            !row.isStatic
              ? h(
                  'a',
                  {
                    class: 'text-red-500 hover:underline cursor-pointer',
                    onClick: () => onActionClick({ code: 'delete', row }),
                  },
                  $t('common.delete', '删除'),
                )
              : null,
          ]);
        },
      },
      title: $t('common.action', '操作'),
      width: 160,
    },
  ];
}
