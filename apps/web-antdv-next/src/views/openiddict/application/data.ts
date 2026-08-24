import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { ApplicationDto } from '#/api/openiddict';

import { h } from 'vue';

import { Tag } from 'antdv-next';

import { $t } from '#/locales';

export function useColumns(
  onActionClick: (params: { code: string; row: ApplicationDto }) => void,
): VxeGridPropTypes.Columns<ApplicationDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'clientId',
      minWidth: 150,
      title: $t('page.openiddict.clientId', '客户端 ID (ClientId)'),
    },
    {
      field: 'displayName',
      minWidth: 140,
      title: $t('page.openiddict.displayName', '应用显示名称'),
    },
    {
      field: 'clientType',
      slots: {
        default: ({ row }) => {
          const isConfidential = row.clientType === 'confidential';
          return h(
            Tag,
            { color: isConfidential ? 'blue' : 'orange' },
            () => row.clientType || 'public',
          );
        },
      },
      title: $t('page.openiddict.clientType', '客户端类型'),
      width: 130,
    },
    {
      field: 'consentType',
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: 'default' },
            () => row.consentType || 'explicit',
          );
        },
      },
      title: $t('page.openiddict.consentType', '授权确认类型'),
      width: 140,
    },
    {
      field: 'redirectUris',
      minWidth: 200,
      slots: {
        default: ({ row }) => {
          const uris = row.redirectUris || [];
          return uris.length > 0 ? uris.join(', ') : '-';
        },
      },
      title: $t('page.openiddict.redirectUris', '回调地址'),
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
                class: 'text-red-500 hover:underline cursor-pointer',
                onClick: () => onActionClick({ code: 'delete', row }),
              },
              $t('common.delete', '删除'),
            ),
          ]);
        },
      },
      title: $t('common.action', '操作'),
      width: 140,
    },
  ];
}
