import type { RouteRecordRaw } from 'vue-router';

// Known URLs remain routable. The entry component checks actual service grants;
// hiding menus must not turn an authorization failure into a misleading 404.
export function filterAppDeviceRoutes(
  routes: RouteRecordRaw[],
  policies: Record<string, boolean>,
): RouteRecordRaw[] {
  return routes.map((route) => {
    if (route.path !== '/app-device' || !route.children) return route;
    const children: RouteRecordRaw[] = route.children.map((child) => {
      const allowed =
        (child.meta?.authority as string[] | undefined)?.some(
          (key) => policies[key] === true,
        ) ?? false;
      return {
        ...child,
        meta: {
          ...child.meta,
          title: child.meta?.title ?? '',
          authority: undefined,
          hideInMenu: !allowed,
        },
      };
    });
    const first =
      children.find((child) => !child.meta?.hideInMenu) ?? children[0];
    if (!first) return route;
    return {
      ...route,
      children,
      meta: {
        ...route.meta,
        title: route.meta?.title ?? '应用设备',
        hideInMenu: children.every((child) => child.meta?.hideInMenu),
      },
      redirect: `/app-device/${first.path}`,
    };
  });
}

export function withAppDeviceEntryRoutes(
  core: RouteRecordRaw[],
  modules: RouteRecordRaw[],
): RouteRecordRaw[] {
  const deviceRoutes = modules.filter((route) => route.path === '/app-device');
  return core.map((route) =>
    route.path === '/'
      ? { ...route, children: [...(route.children ?? []), ...deviceRoutes] }
      : route,
  );
}
