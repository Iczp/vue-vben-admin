import type { SendTemplateMessageInput } from '#/api/chat/message-template';

import { isSafeHttpUrl } from './template-message';

export interface TemplateField {
  enum?: string[];
  format?: string;
  maxLength?: number;
  name: string;
  required?: boolean;
  type: 'boolean' | 'integer' | 'number' | 'string';
}
export function newDefinition() {
  return JSON.stringify(
    {
      schemaVersion: 1,
      name: '通知',
      fields: [
        { name: 'title', type: 'string', required: true, maxLength: 80 },
      ],
      summary: { prefix: '[通知]', fields: ['title'], separator: '：' },
      layout: {
        type: 'card',
        children: [{ type: 'text', bind: 'title', style: 'heading' }],
      },
      actions: [],
    },
    null,
    2,
  );
}
export function fieldsFromDefinition(definition: string): TemplateField[] {
  try {
    const fields: unknown = JSON.parse(definition).fields;
    if (!Array.isArray(fields) || fields.length > 30) return [];
    return fields.filter(
      (f): f is TemplateField =>
        !!f &&
        typeof f === 'object' &&
        typeof f.name === 'string' &&
        /^[A-Za-z_]\w{0,63}$/.test(f.name) &&
        !['__proto__', 'constructor', 'prototype'].includes(f.name) &&
        ['boolean', 'integer', 'number', 'string'].includes(f.type) &&
        (f.enum === undefined ||
          (Array.isArray(f.enum) &&
            f.enum.every((v: unknown) => typeof v === 'string'))),
    );
  } catch {
    return [];
  }
}
export function parseDataObject(raw: string): Record<string, unknown> {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('数据必须为JSON对象。');
  return data as Record<string, unknown>;
}
export function exampleData(fields: TemplateField[]): Record<string, unknown> {
  return Object.fromEntries(
    fields
      .filter((f) => f.required)
      .map((f) => [
        f.name,
        f.enum?.[0] ??
          (f.type === 'boolean'
            ? false
            : f.type === 'string'
              ? f.format === 'url'
                ? 'https://example.com/'
                : '示例'
              : 0),
      ]),
  );
}
export function validateFieldData(
  fields: TemplateField[],
  data: Record<string, unknown>,
): void {
  for (const field of fields) {
    const value = data[field.name];
    if (value === undefined) {
      if (field.required) throw new Error(`请填写 ${field.name}`);
      continue;
    }
    const expectedType = field.type === 'integer' ? 'number' : field.type;
    if (typeof value !== expectedType)
      throw new Error(`${field.name} 类型不正确`);
    if (
      typeof value === 'number' &&
      (!Number.isFinite(value) ||
        Math.abs(value) > Number.MAX_SAFE_INTEGER ||
        (field.type === 'integer' && !Number.isInteger(value)))
    )
      throw new Error(
        `${field.name} 必须为安全范围内的${field.type === 'integer' ? '整数' : '数值'}`,
      );
    if (
      typeof value === 'string' &&
      (value.length > Math.min(field.maxLength ?? 2000, 2000) ||
        (field.required && !value.trim()) ||
        (field.enum && !field.enum.includes(value)) ||
        (field.format === 'url' && !isSafeHttpUrl(value)))
    )
      throw new Error(`请检查 ${field.name} 的长度、枚举或URL`);
  }
}
/** Failed requests retain their frozen body and identity; edits create a new intent. */
export class TemplateSendAttempt {
  private fingerprint = '';
  private input?: SendTemplateMessageInput;
  prepare(
    sessionUnitId: string,
    templateId: string,
    templateVersion: number,
    data: Record<string, unknown>,
  ): SendTemplateMessageInput {
    const content = {
      templateId,
      templateVersion,
      data: Object.fromEntries(
        Object.entries(data).sort(([a], [b]) => a.localeCompare(b)),
      ),
    };
    const fingerprint = JSON.stringify([sessionUnitId, content]);
    if (fingerprint !== this.fingerprint || !this.input) {
      const bytes = crypto.getRandomValues(new Uint8Array(16));
      const id = btoa(String.fromCharCode(...bytes))
        .replaceAll('+', '-')
        .replaceAll('/', '_')
        .replace(/=+$/, '');
      this.input = {
        clientMessageId: `tpl:${id}`,
        content: JSON.parse(JSON.stringify(content)),
      };
      this.fingerprint = fingerprint;
    }
    return JSON.parse(JSON.stringify(this.input)) as SendTemplateMessageInput;
  }
  reset() {
    this.fingerprint = '';
    this.input = undefined;
  }
}
