import type { ArticleMessageItem } from '#/api/chat/article-message';

export function createArticleMessageId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // getRandomValues also works on HTTP pages where randomUUID is unavailable.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = [...bytes]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function articleClientMessageId(id: string): string {
  // Preserve all UUID bits while fitting Chat_Message.ClientMessageId (26 characters).
  const bytes = id
    .replaceAll(/-/g, '')
    .match(/.{2}/g)!
    .map((hex) => Number.parseInt(hex, 16));
  const encoded = btoa(String.fromCharCode(...bytes))
    .replaceAll(/\+/g, '-')
    .replaceAll(/\//g, '_')
    .replace(/=+$/, '');
  return `art:${encoded}`;
}

export function emptyArticle(): ArticleMessageItem {
  return {
    author: '',
    coverImageUrl: '',
    description: '',
    originalUrl: '',
    title: '',
  };
}
export function webUrl(value: string): string {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}
export function articleItems(content: unknown): ArticleMessageItem[] {
  if (!content || typeof content !== 'object') return [];
  const value = content as Record<string, unknown>;
  const source = value.items ?? value.articleList ?? content;
  return (Array.isArray(source) ? source : [source])
    .filter(
      (item): item is Record<string, unknown> =>
        !!item && typeof item === 'object',
    )
    .map((item) => ({
      author: String(item.author ?? ''),
      coverImageUrl: String(item.coverImageUrl ?? item.coverUrl ?? ''),
      description: String(item.description ?? item.summary ?? ''),
      originalUrl: String(item.originalUrl ?? item.url ?? ''),
      title: String(item.title ?? ''),
    }))
    .filter((item) => item.title || item.originalUrl);
}
export function validateArticles(items: ArticleMessageItem[]): string {
  if (items.length === 0 || items.length > 8)
    return '每组文章必须包含 1～8 篇。';
  for (const [index, item] of items.entries()) {
    if (!item.title.trim() || item.title.length > 256)
      return `第 ${index + 1} 篇：标题必填且不超过 256 字。`;
    if (!webUrl(item.originalUrl) || item.originalUrl.length > 500)
      return `第 ${index + 1} 篇：请填写有效的 HTTP/HTTPS 阅读地址。`;
    if (
      item.coverImageUrl &&
      (!webUrl(item.coverImageUrl) || item.coverImageUrl.length > 500)
    )
      return `第 ${index + 1} 篇：封面必须使用 HTTP/HTTPS 地址。`;
    if (item.description.length > 256 || item.author.length > 50)
      return `第 ${index + 1} 篇：摘要不超过 256 字，作者不超过 50 字。`;
  }
  return '';
}
