export function formatDuration(seconds?: null | number): string {
  if (seconds == null || !Number.isFinite(seconds)) return '—';
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = String(total % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}`
    : `${minutes}:${remainder}`;
}
export function weightedRetention(
  items: { baseUsers: number; retainedUsers: number; retentionDay: number }[],
  day: number,
): number | undefined {
  const cohorts = items.filter(
    (item) => item.retentionDay === day && item.baseUsers > 0,
  );
  const base = cohorts.reduce((sum, item) => sum + item.baseUsers, 0);
  return base
    ? cohorts.reduce((sum, item) => sum + item.retainedUsers, 0) / base
    : undefined;
}
