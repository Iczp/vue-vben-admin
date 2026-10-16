import { describe, expect, it, vi } from 'vitest';

const requestGet = vi.hoisted(() => vi.fn());
const requestPost = vi.hoisted(() => vi.fn());
vi.mock('#/api/request', () => ({
  requestClient: { get: requestGet, post: requestPost },
}));
import {
  findArticleSenderSessionApi,
  parseArticleResponse,
  sendArticleMessageApi,
} from '#/api/chat/article-message';

import {
  articleClientMessageId,
  articleItems,
  emptyArticle,
  validateArticles,
  webUrl,
} from './article-draft';

describe('article draft', () => {
  it('fits the database limit without discarding UUID bits and stays stable on retry', () => {
    const uuid = '12345678-90ab-4cde-8f12-3456789abcde';
    const id = articleClientMessageId(uuid);
    expect(id).toHaveLength(26);
    expect(articleClientMessageId(uuid)).toBe(id);
    const decoded = atob(
      `${id.slice(4).replaceAll('-', '+').replaceAll('_', '/')}==`,
    );
    expect(
      [...decoded]
        .map((char) => char.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    ).toBe(uuid.replaceAll('-', ''));
    expect(
      articleClientMessageId('12345678-90ab-4cde-8f12-3456789abcdf'),
    ).not.toBe(id);
  });
  it('uses the existing GET find-id API and its exact query parameter spelling', async () => {
    requestGet.mockResolvedValue('session-guid');
    expect(await findArticleSenderSessionApi('5874', '5874')).toBe(
      'session-guid',
    );
    expect(requestGet).toHaveBeenCalledWith('/chat/session-unit/find-id', {
      params: { ownerId: '5874', destinactionId: '5874' },
    });
  });
  it('directly posts article content to the session unit returned by find-id', async () => {
    const sessionUnitId = 'a413b11e-b942-47d2-a78d-a4d1ba71bd29';
    const input = {
      clientMessageId: 'article:test',
      content: {
        items: [
          {
            ...emptyArticle(),
            title: '文章',
            originalUrl: 'https://example.com/article',
          },
        ],
      },
    };
    requestGet.mockResolvedValue(sessionUnitId);
    const selectedSessionUnitId = await findArticleSenderSessionApi(
      '5874',
      '5874',
    );
    await sendArticleMessageApi(selectedSessionUnitId, input);
    expect(requestPost).toHaveBeenCalledWith(
      `/chat/message-sender/send-article-content-message/${sessionUnitId}`,
      input,
      expect.anything(),
    );
  });
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
        String.raw`{"id":1234567890123456789,"nextCursorId":1234567890123456788,"title":"1234567890123456789 and \"id\":99","count":20}`,
      ),
    ).toEqual({
      id: '1234567890123456789',
      nextCursorId: '1234567890123456788',
      title: '1234567890123456789 and "id":99',
      count: 20,
    });
  });
});
