import { describe, expect, it } from 'vitest';

import {
  formatMediaDuration,
  formatMediaSize,
  selectionLimit,
  toggleMediaSelection,
} from './media';
describe('media selection across pages', () => {
  it('replaces the selection in single mode', () => {
    expect(toggleMediaSelection(['a'], 'b', false, 10)).toEqual(['b']);
  });
  it('keeps prior pages and prevents a new choice at the limit', () => {
    const selected = toggleMediaSelection(['page1'], 'page2', true, 2);
    expect(selected).toEqual(['page1', 'page2']);
    expect(toggleMediaSelection(selected, 'page3', true, 2)).toBe(selected);
    expect(toggleMediaSelection(selected, 'page1', true, 2)).toEqual(['page2']);
  });
  it('normalizes invalid limits and enforces single selection', () => {
    expect(selectionLimit(false, 20)).toBe(1);
    expect(selectionLimit(true, 0)).toBe(1);
    expect(selectionLimit(true, Number.NaN)).toBe(20);
  });
  it('distinguishes missing duration from zero and formats hours', () => {
    expect(formatMediaDuration(null)).toBe('未采集');
    expect(formatMediaDuration(0)).toBe('00:00');
    expect(formatMediaDuration(3661)).toBe('01:01:01');
    expect(formatMediaSize(1024)).toBe('1.00 KB');
  });
});
