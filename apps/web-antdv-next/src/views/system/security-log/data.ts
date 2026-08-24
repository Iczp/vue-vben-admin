import type { VxeGridPropTypes } from '#/adapter/vxe-table';
import type { SecurityLogDto } from '#/api/logmanagement';

import { h } from 'vue';

import { Tag } from 'antdv-next';
import dayjs from 'dayjs';

import { $t } from '#/locales';

export function useColumns(): VxeGridPropTypes.Columns<SecurityLogDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      field: 'action',
      minWidth: 120,
      slots: {
        default: ({ row }) => {
          return h(
            Tag,
            { color: 'blue' },
            () => row.action || 'Unknown',
          );
        },
      },
      title: $t('page.system.log.action', '操作行为'),
    },
    {
      field: 'userName',
      minWidth: 110,
      title: $t('page.identity.user.userName', '用户名'),
    },
    {
      field: 'applicationName',
      minWidth: 120,
      title: $t('page.system.log.applicationName', '应用名'),
    },
    {
      field: 'clientIpAddress',
      minWidth: 130,
      title: $t('page.system.log.clientIp', 'IP 地址'),
    },
    {
      field: 'clientId',
      minWidth: 120,
      title: $t('page.openiddict.clientId', '客户端 ID'),
    },
    {
      field: 'browserInfo',
      minWidth: 180,
      title: $t('page.system.log.browserInfo', '浏览器/客户端信息'),
    },
    {
      field: 'creationTime',
      formatter: ({ cellValue }) =>
        cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') : '-',
      title: $t('common.creationTime', '记录时间'),
      width: 160,
    },
  ];
}
