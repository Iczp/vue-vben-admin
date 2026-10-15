export const antiforgeryServices = {
  appDevice: {
    cookieName: 'AppDevice.XSRF-TOKEN',
    configurationPath: '/app-device/abp/application-configuration',
  },
  im: {
    cookieName: 'IM.XSRF-TOKEN',
    configurationPath: '/abp/application-configuration',
  },
  chat: {
    cookieName: 'Chat.XSRF-TOKEN',
    configurationPath: '/chat/abp/application-configuration',
  },
  cms: {
    cookieName: 'Cms.XSRF-TOKEN',
    configurationPath: '/cms/abp/application-configuration',
  },
  statistics: {
    cookieName: 'AppStatistic.XSRF-TOKEN',
    configurationPath: '/app-statistic/abp/application-configuration',
  },
} as const;

type Service = (typeof antiforgeryServices)[keyof typeof antiforgeryServices];

function serviceFor(url: string): Service | undefined {
  const pathname = new URL(url, 'http://api.local').pathname.replace(
    /^\/api(?=\/)/,
    '',
  );
  if (/^\/chat\/scan-login(?:\/|$)/.test(pathname)) return undefined;
  if (/^\/chat(?:\/|$)/.test(pathname)) return antiforgeryServices.chat;
  if (/^\/cms(?:\/|$)/.test(pathname)) return antiforgeryServices.cms;
  if (/^\/app-statistic(?:\/|$)/.test(pathname))
    return antiforgeryServices.statistics;
  if (/^\/app-device(?:\/|$)/.test(pathname))
    return antiforgeryServices.appDevice;
  return antiforgeryServices.im;
}

export function createAbpAntiforgery(dependencies: {
  loadConfiguration: (service: Service) => Promise<unknown>;
  readCookie: (name: string) => string | undefined;
}) {
  const initialized = new Map<Service, string>();
  const pending = new Map<
    Service,
    { context: string; promise: Promise<void> }
  >();
  return async (url: string, method: string, context: string) => {
    if (['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase()))
      return undefined;
    const service = serviceFor(url);
    if (!service) return undefined;
    if (
      initialized.get(service) !== context ||
      !dependencies.readCookie(service.cookieName)
    ) {
      let current = pending.get(service);
      if (!current || current.context !== context) {
        const promise = (async () => {
          await dependencies.loadConfiguration(service);
          if (!dependencies.readCookie(service.cookieName)) {
            throw new Error(
              `未取得 ${service.cookieName} 防伪令牌，请检查当前服务配置路由和浏览器 Cookie。`,
            );
          }
          initialized.set(service, context);
        })();
        current = { context, promise };
        pending.set(service, current);
      }
      try {
        await current.promise;
      } finally {
        if (pending.get(service) === current) pending.delete(service);
      }
    }
    return dependencies.readCookie(service.cookieName);
  };
}
