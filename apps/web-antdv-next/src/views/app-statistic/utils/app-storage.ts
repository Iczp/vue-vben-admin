const APP_STATISTIC_APP_ID_KEY = 'app_statistic_selected_app_id';

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
 * 存储选中的 AppId
 */
export function setStoredAppId(appId: string | undefined): void {
  try {
    if (appId && appId !== 'default') {
      localStorage.setItem(APP_STATISTIC_APP_ID_KEY, appId);
    } else {
      localStorage.removeItem(APP_STATISTIC_APP_ID_KEY);
    }
  } catch {
    // ignore
  }
}
