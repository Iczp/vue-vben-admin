import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { IdentityUserDto } from '#/api/identity';

import { h } from 'vue';

import { Tag } from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';

export function useColumns(
  onActionClick: (params: { code: string; row: IdentityUserDto }) => void,
): VxeGridPropTypes.Columns<IdentityUserDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'userName',
      minWidth: 120,
      title: $t('page.identity.user.userName', '用户名'),
    },
    {
      field: 'name',
      minWidth: 100,
      slots: {
        default: ({ row }) => {
          return `${row.name || ''} ${row.surname || ''}`.trim() || '-';
        },
      },
      title: $t('page.identity.user.name', '姓名'),
    },
    {
      field: 'email',
      minWidth: 160,
      title: $t('page.identity.user.email', '邮箱'),
    },
    {
      field: 'phoneNumber',
      minWidth: 130,
      title: $t('page.identity.user.phoneNumber', '手机号'),
    },
    {
      field: 'isActive',
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: row.isActive ? 'success' : 'error' },
            () =>
              row.isActive
                ? $t('common.enabled', '启用')
                : $t('common.disabled', '禁用'),
          );
        },
      },
      title: $t('page.identity.user.status', '状态'),
      width: 90,
    },
    {
      field: 'lockoutEnabled',
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: row.lockoutEnabled ? 'warning' : 'default' },
            () =>
              row.lockoutEnabled
                ? $t('common.yes', '是')
                : $t('common.no', '否'),
          );
        },
      },
      title: $t('page.identity.user.lockout', '锁定保护'),
      width: 100,
    },
    {
      field: 'creationTime',
      formatter: ({ cellValue }) =>
        cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm') : '-',
      title: $t('common.creationTime', '创建时间'),
      width: 150,
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
      width: 170,
    },
  ];
}
