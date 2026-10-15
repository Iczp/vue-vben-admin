export const appDevicePermissions = {
  read: 'AppDevice.Devices.Read',
  update: 'AppDevice.Devices.Update',
  enable: 'AppDevice.Devices.Enable',
  disable: 'AppDevice.Devices.Disable',
  delete: 'AppDevice.Devices.Delete',
  bindings: 'AppDevice.Bindings.Read',
  groups: 'AppDevice.Groups.Read',
  manageGroups: 'AppDevice.Groups.Manage',
  members: 'AppDevice.GroupMembers.Manage',
} as const;

// Only this service can grant AppDevice policies; other services cannot retain stale grants.
export function mergeAppDevicePolicies(main: Record<string, boolean>, device: Record<string, boolean>) {
  return {
    ...Object.fromEntries(Object.entries(main).filter(([key]) => !key.startsWith('AppDevice.'))),
    ...Object.fromEntries(Object.entries(device).filter(([key]) => key.startsWith('AppDevice.'))),
  };
}
