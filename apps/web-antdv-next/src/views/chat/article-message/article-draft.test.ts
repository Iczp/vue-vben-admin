import { describe, expect, it, vi } from 'vitest';

vi.mock('#/api/request', () => ({ requestClient: {} }));
import { parseArticleResponse } from '#/api/chat/article-message';

import {
  articleItems,
  emptyArticle,
  validateArticles,
  webUrl,
} from './article-draft';

describe('article draft', () => {
  it('keeps ordered group snapshots and legacy article fields', () => {
    expect(
      articleItems({
        items: [
          { title: 'First', originalUrl: 'https://example.com/1' },
          { title: 'Second' },
        ],
      }).map((item) => item.title),
    ).toEqual(['First', 'Second']);
    expect(
      articleItems({ title: 'Legacy', url: 'https://example.com' })[0]
        ?.originalUrl,
    ).toBe('https://example.com');
    expect(articleItems(null)).toEqual([]);
  });
  it('validates sizes and disallows executable links or embedded credentials', () => {
    expect(webUrl('javascript:alert(1)')).toBe('');
    expect(webUrl('https://user:secret@example.com')).toBe('');
    expect(validateArticles([emptyArticle()])).not.toBe('');
    const item = {
      ...emptyArticle(),
      title: 'Title',
      originalUrl: 'https://example.com',
    };
    expect(validateArticles([item])).toBe('');
    expect(validateArticles(Array.from({ length: 9 }, () => item))).not.toBe(
      '',
    );
  });
  it('preserves bigint message cursors and leaves quoted text unchanged', () => {
    expect(
      parseArticleResponse(
        '{"id":1234567890123456789,"nextCursorId":1234567890123456788,"title":"1234567890123456789 and \\"id\\":99","count":20}',
      ),
    ).toEqual({
      id: '1234567890123456789',
      nextCursorId: '1234567890123456788',
      title: '1234567890123456789 and "id":99',
      count: 20,
    });
  });
});
