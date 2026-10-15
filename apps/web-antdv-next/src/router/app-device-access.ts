import type { RouteRecordRaw } from 'vue-router';

// Existing routes support a legacy administrator wildcard. Device routes require actual service grants.
export function filterAppDeviceRoutes(routes: RouteRecordRaw[], policies: Record<string, boolean>): RouteRecordRaw[] {
  return routes.flatMap((route) => {
    if (route.path !== '/app-device') return [route];
    const children = route.children?.filter((child) => (child.meta?.authority as string[] | undefined)?.some((key) => policies[key] === true)) ?? [];
    return children.length ? [{ ...route, children, redirect: `/app-device/${children[0]!.path}` }] : [];
  });
}
