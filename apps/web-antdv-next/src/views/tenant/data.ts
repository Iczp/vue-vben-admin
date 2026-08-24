import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { TenantDto } from '#/api/multi-tenancy';

import { h } from 'vue';

import { $t } from '#/locales';

export function useColumns(
  onActionClick: (params: { code: string; row: TenantDto }) => void,
): VxeGridPropTypes.Columns<TenantDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'name',
      minWidth: 160,
      title: $t('page.tenant.name', '租户名称'),
    },
    {
      field: 'id',
      minWidth: 220,
      title: $t('page.tenant.id', '租户标识 (Tenant ID)'),
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
                onClick: () => onActionClick({ code: 'connection-string', row }),
              },
              $t('page.tenant.connectionString', '数据库连接'),
            ),
            h(
              'a',
              {
                class: 'text-primary hover:underline cursor-pointer',
                onClick: () => onActionClick({ code: 'permission', row }),
              },
              $t('page.permission.title', '权限'),
            ),
            h(
              'a',
              {
                class: 'text-red-500 hover:underline cursor-pointer',
                onClick: () => onActionClick({ code: 'delete', row }),
              },
              $t('common.delete', '删除'),
            ),
          ]);
        },
      },
      title: $t('common.action', '操作'),
      width: 220,
    },
  ];
}
