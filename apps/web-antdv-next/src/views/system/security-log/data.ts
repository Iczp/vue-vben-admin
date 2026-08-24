import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { SecurityLogDto } from '#/api/logmanagement';

import { $t } from '#/locales';

/**
 * 纯 JSON 配置的表格列定义
 */
export function useColumns(): VxeTableGridColumns<SecurityLogDto> {
  return [
    {
      title: '#',
      type: 'seq',
      width: 50,
    },
    {
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'success', label: 'LoginSucceeded', value: 'LoginSucceeded' },
          { color: 'error', label: 'LoginFailed', value: 'LoginFailed' },
          { color: 'warning', label: 'Logout', value: 'Logout' },
        ],
      },
      field: 'action',
      minWidth: 140,
      title: $t('page.system.log.action', '操作行为'),
    },
    {
      field: 'userName',
      formatter: 'formatEmpty',
      minWidth: 110,
      title: $t('page.identity.user.userName', '用户名'),
    },
    {
      field: 'applicationName',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: $t('page.system.log.applicationName', '应用名'),
    },
    {
      cellRender: {
        name: 'CellCopyable',
      },
      field: 'clientIpAddress',
      minWidth: 140,
      title: $t('page.system.log.clientIp', 'IP 地址'),
    },
    {
      field: 'clientId',
      formatter: 'formatEmpty',
      minWidth: 120,
      title: $t('page.openiddict.clientId', '客户端 ID'),
    },
    {
      field: 'browserInfo',
      formatter: 'formatEmpty',
      minWidth: 180,
      title: $t('page.system.log.browserInfo', '浏览器/客户端信息'),
    },
    {
      field: 'creationTime',
      formatter: 'formatDateTime',
      title: $t('common.creationTime', '记录时间'),
      width: 170,
    },
  ];
}
