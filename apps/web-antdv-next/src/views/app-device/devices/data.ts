import type { VxeTableGridColumns } from '#/adapter/vxe-table';
import type { AppDevice } from '#/api/modules/app-device';
import { deviceDate } from '../context';

export const deviceColumns: VxeTableGridColumns<AppDevice> = [
  { field: 'profile.name', title: '设备名称', minWidth: 150 },
  { field: 'deviceId', title: 'DeviceId', minWidth: 220, cellRender: { name: 'CellCopyable' } },
  { field: 'profile.platform', title: '平台', width: 100 },
  { field: 'profile.deviceType', title: '设备类型', width: 110 },
  { field: 'profile.brand', title: '品牌', width: 100 },
  { field: 'profile.model', title: '型号', minWidth: 120 },
  { field: 'profile.osVersion', title: '系统版本', width: 120 },
  { field: 'profile.appVersion', title: '应用版本', width: 110 },
  { field: 'isEnabled', title: '启用状态', width: 100, slots: { default: 'enabled' } },
  { field: 'groupIds', title: '所属分组', minWidth: 180, slots: { default: 'groups' } },
  { field: 'lastSeenTime', title: '最近活跃', width: 180, formatter: ({ cellValue }) => deviceDate(cellValue) },
  { field: 'creationTime', title: '创建时间', width: 180, formatter: ({ cellValue }) => deviceDate(cellValue) },
  { title: '操作', width: 250, fixed: 'right', slots: { default: 'actions' } },
];
