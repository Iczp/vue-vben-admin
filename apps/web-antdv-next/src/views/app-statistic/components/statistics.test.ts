import { describe, expect, it } from 'vitest';

import { formatDuration, weightedRetention } from './statistics';
describe('statistics display', () => {
  it('rounds duration before splitting time boundaries', () => {
    expect(formatDuration(59.9)).toBe('1:00');
    expect(formatDuration(3599.9)).toBe('1:00:00');
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(0)).toBe('0:00');
  });
  it('keeps an unavailable duration different from zero', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(undefined)).toBe('—');
  });
  it('weights unequal cohorts and excludes other retention days', () => {
    expect(
      weightedRetention(
        [
          { retentionDay: 1, baseUsers: 100, retainedUsers: 50 },
          { retentionDay: 1, baseUsers: 900, retainedUsers: 90 },
          { retentionDay: 7, baseUsers: 100, retainedUsers: 99 },
        ],
        1,
      ),
    ).toBe(0.14);
  });
  it('keeps immature cohorts different from measured zero retention', () => {
    expect(weightedRetention([], 30)).toBeUndefined();
    expect(
      weightedRetention(
        [{ retentionDay: 1, baseUsers: 20, retainedUsers: 0 }],
        1,
      ),
    ).toBe(0);
  });
});
