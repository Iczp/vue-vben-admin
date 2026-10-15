import { ref } from 'vue';
import { useRoute } from 'vue-router';

export const appDeviceApps = [
  ...new Set(
    String(import.meta.env.VITE_APP_DEVICE_APP_IDS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  ),
];
export function useAppDeviceApp() {
  const route = useRoute();
  const requested =
    typeof route.query.appId === 'string' ? route.query.appId : '';
  return ref(
    appDeviceApps.includes(requested) ? requested : (appDeviceApps[0] ?? ''),
  );
}
export function deviceDate(value?: null | string) {
  if (!value) return '—';
  // The module stores UTC; SQL DateTime projections may omit the zone suffix.
  const date = new Date(
    /[zZ]$|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value}Z`,
  );
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}
export function isDeviceConflict(error: unknown) {
  const body = error as null | { error?: { code?: string } };
  return [
    'AppDevice:ConcurrencyConflict',
    'Volo.Abp:AbpDbConcurrencyError',
  ].includes(body?.error?.code ?? '');
}
