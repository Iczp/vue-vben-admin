import type { StatisticApplicationDto } from '#/api/app-statistic/applications';

import { getStatisticApplicationsApi } from '#/api/app-statistic/applications';

const APP_STATISTIC_APP_ID_KEY = 'app_statistic_selected_app_id';
const APP_STATISTIC_CUSTOM_ALIASES_KEY = 'app_statistic_custom_aliases';
const APP_STATISTIC_CUSTOM_APPS_KEY = 'app_statistic_custom_apps';
const APP_STATISTIC_CHANGE_EVENT = 'app-statistic:app-changed';

/**
 * 格式化后的应用信息项
 */
export interface FormattedAppItem {
  id?: string;
  appId: string;
  name: string; // 最终显示的名称/别名
  rawName?: string; // 后端返回的原始名称
  description?: string;
  customAlias?: string; // 用户自定义的别名
  autoAlias: string; // 系统自动生成的别名
  isCustom: boolean; // 是否应用了自定义别名
  timeZone: string;
  today: string;
}

/**
 * 智能自动生成 App 别名/名称
 * 例如：
 *  - "com.rctea.im" -> "Rctea IM"
 *  - "gotoim-app" -> "Gotoim App"
 *  - "chat_mobile" -> "Chat Mobile"
 *  - "default" -> "默认应用"
 */
export function generateAppAlias(appId: string): string {
  if (!appId || appId === 'default') {
    return '默认应用';
  }

  // 去除常见反向域名格式前缀 (如 com., net., cn., org., io.)
  const clean = appId.replace(/^(com|net|org|cn|io)\./i, '');

  // 按照点、下划线、中划线切分
  const parts = clean.split(/[._-]+/).filter(Boolean);
  if (parts.length === 0) return appId;

  // 常见缩写专有名词字典
  const acronyms: Record<string, string> = {
    im: 'IM',
    app: 'App',
    cms: 'CMS',
    api: 'API',
    sdk: 'SDK',
    ui: 'UI',
    ios: 'iOS',
    android: 'Android',
    h5: 'H5',
    oa: 'OA',
    erp: 'ERP',
    crm: 'CRM',
    web: 'Web',
    pc: 'PC',
    id: 'ID',
    dev: 'Dev',
  };

  const words = parts.map((part) => {
    const lower = part.toLowerCase();
    if (acronyms[lower]) {
      return acronyms[lower];
    }
    // 首字母大写
    return part.charAt(0).toUpperCase() + part.slice(1);
  });

  return words.join(' ');
}

/**
 * 获取用户自定义别名配置表
 */
export function getCustomAliases(): Record<string, string> {
  try {
    const json = localStorage.getItem(APP_STATISTIC_CUSTOM_ALIASES_KEY);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

/**
 * 设置指定 AppId 的别名
 */
export function setAppAlias(appId: string, alias: string): void {
  try {
    const map = getCustomAliases();
    const trimmed = alias.trim();
    if (trimmed) {
      map[appId] = trimmed;
    } else {
      delete map[appId];
    }
    localStorage.setItem(APP_STATISTIC_CUSTOM_ALIASES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * 清除指定 AppId 的自定义别名（恢复自动生成）
 */
export function removeAppAlias(appId: string): void {
  try {
    const map = getCustomAliases();
    delete map[appId];
    localStorage.setItem(APP_STATISTIC_CUSTOM_ALIASES_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

/**
 * 获取用户手动登记的应用列表
 */
export function getCustomApps(): string[] {
  try {
    const json = localStorage.getItem(APP_STATISTIC_CUSTOM_APPS_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

/**
 * 添加手动登记的应用
 */
export function addCustomApp(appId: string, alias?: string): void {
  try {
    const cleanId = appId.trim();
    if (!cleanId) return;

    const list = getCustomApps();
    if (!list.includes(cleanId)) {
      list.push(cleanId);
      localStorage.setItem(APP_STATISTIC_CUSTOM_APPS_KEY, JSON.stringify(list));
    }
    if (alias && alias.trim()) {
      setAppAlias(cleanId, alias);
    }
  } catch {
    // ignore
  }
}

/**
 * 移除手动登记的应用
 */
export function removeCustomApp(appId: string): void {
  try {
    const list = getCustomApps().filter((id) => id !== appId);
    localStorage.setItem(APP_STATISTIC_CUSTOM_APPS_KEY, JSON.stringify(list));
    removeAppAlias(appId);
  } catch {
    // ignore
  }
}

/**
 * 加载所有应用列表（合并后端应用、手动登记应用及自动生成别名）
 */
export async function loadApplicationsWithAliases(): Promise<
  FormattedAppItem[]
> {
  let backendApps: StatisticApplicationDto[] = [];
  try {
    backendApps = await getStatisticApplicationsApi();
  } catch {
    backendApps = [];
  }

  const customAliases = getCustomAliases();
  const customApps = getCustomApps();

  const appMap = new Map<string, FormattedAppItem>();

  // 1. 处理后端返回的应用
  for (const app of backendApps) {
    const autoAlias = generateAppAlias(app.appId);
    const custom = customAliases[app.appId];
    const backendName =
      app.name && app.name !== app.appId ? app.name : undefined;

    // 确定展示名称：用户自定义别名 > 后端显式配置名称 > 自动生成别名
    const displayName = custom || backendName || autoAlias;

    appMap.set(app.appId, {
      id: app.id,
      appId: app.appId,
      name: displayName,
      rawName: app.name,
      description: app.description,
      customAlias: custom,
      autoAlias,
      isCustom: Boolean(custom),
      timeZone: app.timeZone || 'UTC',
      today: app.today || new Date().toISOString().slice(0, 10),
    });
  }

  // 2. 处理前端手动登记的应用
  const todayStr = new Date().toISOString().slice(0, 10);
  for (const appId of customApps) {
    if (!appMap.has(appId)) {
      const autoAlias = generateAppAlias(appId);
      const custom = customAliases[appId];
      appMap.set(appId, {
        appId,
        name: custom || autoAlias,
        rawName: undefined,
        customAlias: custom,
        autoAlias,
        isCustom: Boolean(custom),
        timeZone: 'UTC',
        today: todayStr,
      });
    }
  }

  return [...appMap.values()].sort((a, b) => a.appId.localeCompare(b.appId));
}

/**
 * 获取当前选中的 AppId
 */
export function getStoredAppId(): string | undefined {
  try {
    const val = localStorage.getItem(APP_STATISTIC_APP_ID_KEY);
    return val && val !== 'default' ? val : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 存储选中的 AppId 并广播变更事件
 */
export function setStoredAppId(appId: string | undefined): void {
  try {
    if (appId && appId !== 'default') {
      localStorage.setItem(APP_STATISTIC_APP_ID_KEY, appId);
    } else {
      localStorage.removeItem(APP_STATISTIC_APP_ID_KEY);
    }
    // 广播应用切换事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(APP_STATISTIC_CHANGE_EVENT, {
          detail: { appId: appId || undefined },
        }),
      );
    }
  } catch {
    // ignore
  }
}

/**
 * 监听 App 变更事件
 */
export function onAppChange(
  handler: (appId: string | undefined) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<{ appId?: string }>;
    handler(customEvent.detail?.appId);
  };

  window.addEventListener(APP_STATISTIC_CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener(APP_STATISTIC_CHANGE_EVENT, listener);
  };
}
