import { effectScope } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import { useCursorPage } from './use-cursor-page';

describe('device cursor navigation', () => {
  it('uses returned cursors and never invents offsets or totals', async () => {
    const scope = effectScope();
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ items: ['a'], nextId: 'cursor-a' })
      .mockResolvedValueOnce({ items: ['b'], nextId: null })
      .mockResolvedValueOnce({ items: ['a'], nextId: 'cursor-a' });
    const page = scope.run(() => useCursorPage<string>(loader));
    if (!page) throw new Error('Inactive test scope');
    await page.reset();
    await page.next();
    expect(loader.mock.calls).toEqual([
      [undefined, 50],
      ['cursor-a', 50],
    ]);
    expect(page.hasNext.value).toBe(false);
    await page.previous();
    expect(page.items.value).toEqual(['a']);
    expect(page.page.value).toBe(1);
    scope.stop();
  });
  it('keeps the current page on failure and permits a retry', async () => {
    const scope = effectScope();
    const loader = vi
      .fn()
      .mockResolvedValueOnce({ items: ['a'], nextId: 'a' })
      .mockRejectedValueOnce(new Error('unavailable'))
      .mockResolvedValueOnce({ items: ['b'] });
    const page = scope.run(() => useCursorPage<string>(loader));
    if (!page) throw new Error('Inactive test scope');
    await page.reset();
    await page.next();
    expect(page.page.value).toBe(1);
    expect(page.items.value).toEqual(['a']);
    expect(page.failed.value).toBe(true);
    await page.next();
    expect(page.page.value).toBe(2);
    expect(page.failed.value).toBe(false);
    scope.stop();
  });
  it('ignores a late previous-scope response and resets navigation', async () => {
    const scope = effectScope();
    let finish!: (value: { items: string[] }) => void;
    const loader = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce({ items: ['new scope'] });
    const page = scope.run(() => useCursorPage<string>(loader));
    if (!page) throw new Error('Inactive test scope');
    const old = page.reset();
    page.take.value = 20;
    await page.reset();
    finish({ items: ['old scope'] });
    await old;
    expect(page.items.value).toEqual(['new scope']);
    expect(page.page.value).toBe(1);
    expect(loader).toHaveBeenLastCalledWith(undefined, 20);
    scope.stop();
  });
  it('does not restore cleared data after closing a drawer', async () => {
    const scope = effectScope();
    let finish!: (value: { items: string[] }) => void;
    const page = scope.run(() =>
      useCursorPage<string>(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      ),
    );
    if (!page) throw new Error('Inactive test scope');
    const pending = page.reset();
    page.clear();
    finish({ items: ['private'] });
    await pending;
    expect(page.items.value).toEqual([]);
    expect(page.loading.value).toBe(false);
    scope.stop();
  });
});
