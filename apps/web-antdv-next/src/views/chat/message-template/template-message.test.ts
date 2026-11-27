// @vitest-environment happy-dom
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createApp, nextTick } from 'vue';

import { describe, expect, it, vi } from 'vitest';

import {
  fieldsFromDefinition,
  newDefinition,
  parseDataObject,
  TemplateSendAttempt,
  validateFieldData,
} from './template-draft';
import { parseTemplateSnapshot } from './template-message';
import TemplatePreview from './template-preview.vue';

const calls = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn() }));
vi.mock('#/api/request', () => ({ requestClient: calls }));
import {
  createMessageTemplateApi,
  getMessageTemplateRevisionApi,
  getMessageTemplateRevisionsApi,
  publishMessageTemplateApi,
  sendTemplateContentMessageApi,
  setMessageTemplateEnabledApi,
  updateMessageTemplateApi,
} from '#/api/chat/message-template';

const dir = resolve(process.cwd(), 'src/views/chat/message-template/fixtures');
describe('跨端协议共同夹具', () => {
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    it(file, () => {
      const fixture = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
      const result = parseTemplateSnapshot(fixture);
      expect(result.valid).toBe(!fixture.clientExpectation.fallback);
      expect(result.fallbackText).toBe(
        fixture.clientExpectation.expectedFallbackText,
      );
    });
  }
});
describe('发送意图与合同', () => {
  it('动态表单拒绝缺必填、错误类型和不安全整数', () => {
    const fields = [
      { name: 'count', type: 'integer' as const, required: true },
    ];
    expect(() => validateFieldData(fields, {})).toThrow();
    expect(() => validateFieldData(fields, { count: '1' })).toThrow();
    expect(() => validateFieldData(fields, { count: 1.5 })).toThrow();
    expect(() =>
      validateFieldData(fields, { count: Number.MAX_SAFE_INTEGER + 1 }),
    ).toThrow();
    expect(() => validateFieldData(fields, { count: 0 })).not.toThrow();
  });
  it('失败重试保持标识和内容，数据编辑与会话切换生成新标识', () => {
    const attempt = new TemplateSendAttempt();
    const data = { title: '第一次' };
    const first = attempt.prepare('s1', 'template', 2, data);
    expect(first.clientMessageId.length).toBeLessThanOrEqual(26);
    expect(attempt.prepare('s1', 'template', 2, data)).toEqual(first);
    first.content.data.title = '调用方篡改';
    expect(attempt.prepare('s1', 'template', 2, data).content.data.title).toBe(
      '第一次',
    );
    data.title = '第二次';
    const edited = attempt.prepare('s1', 'template', 2, data);
    expect(edited.clientMessageId).not.toBe(first.clientMessageId);
    expect(attempt.prepare('s2', 'template', 2, data).clientMessageId).not.toBe(
      edited.clientMessageId,
    );
  });
  it('字段顺序变化不产生重复意图', () => {
    const attempt = new TemplateSendAttempt();
    expect(
      attempt.prepare('s', 't', 1, { a: 'a', b: 'b' }).clientMessageId,
    ).toBe(attempt.prepare('s', 't', 1, { b: 'b', a: 'a' }).clientMessageId);
  });
  it('字段使用发布定义，数据必须为对象', () => {
    expect(fieldsFromDefinition(newDefinition()).map((f) => f.name)).toEqual([
      'title',
    ]);
    expect(
      fieldsFromDefinition(
        '{"fields":[{"name":"constructor","type":"string"}]}',
      ),
    ).toEqual([]);
    expect(() => parseDataObject('[]')).toThrow();
    expect(() => parseDataObject('null')).toThrow();
  });
  it('创建与更新发送真实Contract字段和并发戳', () => {
    const input = {
      definition: newDefinition(),
      name: '通知',
      ownerId: '9007199254740993',
      visibility: 0 as const,
    };
    createMessageTemplateApi(input);
    expect(calls.post).toHaveBeenCalledWith(
      '/chat/admin/message-template',
      input,
      expect.any(Object),
    );
    const update = { ...input, concurrencyStamp: 'stamp' };
    updateMessageTemplateApi('id', update);
    expect(calls.put).toHaveBeenCalledWith(
      '/chat/admin/message-template/id',
      update,
      expect.any(Object),
    );
  });
  it('发布启停和版本分页命中ChatAdmin自动路由', () => {
    publishMessageTemplateApi('id', { concurrencyStamp: 'stamp' });
    expect(calls.post).toHaveBeenCalledWith(
      '/chat/admin/message-template/id/publish',
      { concurrencyStamp: 'stamp' },
    );
    setMessageTemplateEnabledApi('id', {
      concurrencyStamp: 'stamp',
      isEnabled: false,
    });
    expect(calls.post).toHaveBeenCalledWith(
      '/chat/admin/message-template/id/set-enabled',
      { concurrencyStamp: 'stamp', isEnabled: false },
      expect.any(Object),
    );
    getMessageTemplateRevisionsApi('id', 20);
    expect(calls.get).toHaveBeenCalledWith(
      '/chat/admin/message-template/id/revisions',
      { params: { maxResultCount: 20, skipCount: 20 } },
    );
    getMessageTemplateRevisionApi('id', 2);
    expect(calls.get).toHaveBeenCalledWith(
      '/chat/admin/message-template/id/revision',
      { params: { version: 2 } },
    );
  });
  it('发送必须使用MessageInput.content包装，禁止旧ignoreVersion', () => {
    const input = new TemplateSendAttempt().prepare('session', 'template', 3, {
      title: '通知',
    });
    sendTemplateContentMessageApi('session', input);
    expect(calls.post).toHaveBeenCalledWith(
      '/chat/admin/message/send-template-content-message/session',
      expect.objectContaining({
        content: {
          templateId: 'template',
          templateVersion: 3,
          data: { title: '通知' },
        },
      }),
      expect.any(Object),
    );
    expect(input).not.toHaveProperty('ignoreVersion');
  });
});
describe('真实Vue预览', () => {
  async function mount(snapshot: unknown) {
    const host = document.createElement('div');
    const app = createApp(TemplatePreview, { snapshot });
    app.mount(host);
    await nextTick();
    return { host, cleanup: () => app.unmount() };
  }
  it('递归展示合法嵌套、布尔中文值，预览不执行动作', async () => {
    const snapshot = JSON.parse(
      readFileSync(`${dir}/02-full-card.json`, 'utf8'),
    ).snapshot;
    snapshot.data.active = false;
    snapshot.layout.children = [
      {
        type: 'column',
        children: [
          {
            type: 'row',
            children: [
              { type: 'field', label: '有效', bind: 'active' },
              { type: 'button', label: '详情', actionId: 'viewDetail' },
            ],
          },
        ],
      },
    ];
    const { host, cleanup } = await mount(snapshot);
    try {
      expect(host.textContent).toContain('否');
      expect(host.querySelector('button')?.disabled).toBe(true);
    } finally {
      cleanup();
    }
  });
  it('未知组件与恶意URL不生成交互DOM', async () => {
    const snapshot = JSON.parse(
      readFileSync(`${dir}/06-illegal-url.json`, 'utf8'),
    ).snapshot;
    const { host, cleanup } = await mount(snapshot);
    try {
      expect(host.textContent).toContain(snapshot.fallbackText);
      expect(host.querySelector('button,a,img')).toBeNull();
    } finally {
      cleanup();
    }
  });
});
