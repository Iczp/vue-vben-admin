/**
 * 自定义模板消息协议规范 (v1)
 * 对齐 Rctea.IM / IczpNet.Chat 自定义模板消息定义
 */

export const TEMPLATE_SCHEMA_VERSION = 1;
export const MAX_TEMPLATE_NODES = 50;
export const MAX_TEMPLATE_DEPTH = 6;
export const MAX_ACTIONS = 3;
export const MAX_STATIC_TEXT_LENGTH = 1000;
export const MAX_FIELD_TEXT_LENGTH = 2000;
export const MAX_FALLBACK_TEXT_LENGTH = 256;
export const MAX_TEMPLATE_BYTES = 64 * 1024;

export const ALLOWED_NODE_TYPES = [
  'card',
  'column',
  'row',
  'text',
  'field',
  'badge',
  'image',
  'divider',
  'button',
] as const;

export type TemplateNodeType = (typeof ALLOWED_NODE_TYPES)[number];

export type TemplateNodeStyle = 'body' | 'heading' | 'secondary';
export type TemplateTone = 'danger' | 'neutral' | 'success' | 'warning';
export type TemplateAspectRatio = 'landscape' | 'portrait' | 'square';
export type TemplateGap = 'large' | 'medium' | 'small';

export interface BaseTemplateNode {
  type: string;
}

export interface CardNode extends BaseTemplateNode {
  type: 'card';
  children: TemplateNode[];
}

export interface ColumnNode extends BaseTemplateNode {
  type: 'column';
  children: TemplateNode[];
  gap?: TemplateGap;
}

export interface RowNode extends BaseTemplateNode {
  type: 'row';
  children: TemplateNode[];
  gap?: TemplateGap;
}

export interface TextNode extends BaseTemplateNode {
  type: 'text';
  text?: string;
  bind?: string;
  style?: TemplateNodeStyle;
}

export interface FieldNode extends BaseTemplateNode {
  type: 'field';
  label: string;
  bind: string;
}

export interface BadgeNode extends BaseTemplateNode {
  type: 'badge';
  text?: string;
  bind?: string;
  tone?: TemplateTone;
}

export interface ImageNode extends BaseTemplateNode {
  type: 'image';
  resourceId?: string;
  bind?: string;
  aspectRatio?: TemplateAspectRatio;
}

export interface DividerNode extends BaseTemplateNode {
  type: 'divider';
}

export interface ButtonNode extends BaseTemplateNode {
  type: 'button';
  label: string;
  actionId: string;
}

export type TemplateNode =
  | BadgeNode
  | ButtonNode
  | CardNode
  | ColumnNode
  | DividerNode
  | FieldNode
  | ImageNode
  | RowNode
  | TextNode;

export interface TemplateAction {
  id: string;
  type: 'copyText' | 'openUrl';
  bind: string;
}

export interface TemplateSnapshot {
  schemaVersion: number;
  templateId: string;
  templateVersion: number;
  templateName?: string;
  fallbackText?: string;
  data: Record<string, unknown>;
  layout: CardNode;
  actions?: TemplateAction[];
  resources?: { blobId: string; id: string }[];
}

export interface ParsedTemplateResult {
  valid: boolean;
  snapshot?: TemplateSnapshot;
  fallbackText: string;
  errorReason?: string;
}

const forbiddenNames = new Set(['__proto__', 'constructor', 'prototype']);
const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const isName = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value) &&
  !forbiddenNames.has(value);
const isText = (
  value: unknown,
  max = MAX_STATIC_TEXT_LENGTH,
): value is string => typeof value === 'string' && value.length <= max;
const hasOwn = (value: object, key: string): boolean =>
  Object.prototype.hasOwnProperty.call(value, key);

/** HTTP 地址必须显式声明协议，禁止凭据、控制字符和浏览器容错后的歧义地址。 */
export function isSafeHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 500) return false;
  const url = value.trim();
  if (!/^https?:\/\//i.test(url) || /[\u0000-\u0020\u007f\\]/.test(url))
    return false;
  try {
    const parsed = new URL(url);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      !!parsed.hostname &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

/** 摘要是唯一允许在未知协议或损坏布局时展示的内容。 */
export function templateFallbackText(value: unknown): string {
  if (typeof value !== 'string') return '[模板消息] 内容暂不可用';
  const text = value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim();
  let end = Math.min(text.length, MAX_FALLBACK_TEXT_LENGTH);
  if (end < text.length && /[\ud800-\udbff]/.test(text[end - 1] || '')) end--;
  return text.slice(0, end) || '[模板消息] 内容暂不可用';
}

export function formatTemplateValue(value: unknown): string {
  if (typeof value === 'boolean') return value ? '是' : '否';
  return value === undefined || value === null ? '' : String(value);
}

function validateTree(
  node: unknown,
  depth: number,
  counter: { images: number; nodes: number },
  actions: Map<string, TemplateAction>,
  data: Record<string, unknown>,
): string | undefined {
  if (!isObject(node)) return 'invalid_node_object';
  if (++counter.nodes > MAX_TEMPLATE_NODES) return 'exceeded_max_nodes';
  if (depth > MAX_TEMPLATE_DEPTH) return 'exceeded_max_depth';
  const type = node.type;
  if (
    typeof type !== 'string' ||
    !ALLOWED_NODE_TYPES.includes(type as TemplateNodeType)
  )
    return 'unknown_component';
  const attributes: Record<string, string[]> = {
    card: ['children'],
    column: ['children', 'gap'],
    row: ['children', 'gap'],
    text: ['text', 'bind', 'style'],
    field: ['label', 'bind'],
    badge: ['text', 'bind', 'tone'],
    image: ['bind', 'resourceId', 'aspectRatio'],
    divider: [],
    button: ['label', 'actionId'],
  };
  if (
    Object.keys(node).some(
      (key) => key !== 'type' && !attributes[type]!.includes(key),
    )
  )
    return 'invalid_node_attribute';
  if (hasOwn(node, 'bind') && !isName(node.bind)) return 'invalid_binding';
  if (hasOwn(node, 'text') && !isText(node.text)) return 'static_text_too_long';
  if (hasOwn(node, 'label') && !isText(node.label)) return 'invalid_label';
  if (
    hasOwn(node, 'gap') &&
    !['large', 'medium', 'small'].includes(String(node.gap))
  )
    return 'invalid_gap';
  if (
    hasOwn(node, 'style') &&
    !['body', 'heading', 'secondary'].includes(String(node.style))
  )
    return 'invalid_style';
  if (
    hasOwn(node, 'tone') &&
    !['danger', 'neutral', 'success', 'warning'].includes(String(node.tone))
  )
    return 'invalid_tone';
  if (
    hasOwn(node, 'aspectRatio') &&
    !['landscape', 'portrait', 'square'].includes(String(node.aspectRatio))
  )
    return 'invalid_aspect_ratio';
  if (type === 'text' || type === 'badge') {
    if (hasOwn(node, 'text') === hasOwn(node, 'bind'))
      return 'text_or_binding_required';
  }
  if (type === 'field' && (!isText(node.label) || !isName(node.bind)))
    return 'invalid_field';
  if (
    type === 'button' &&
    (!isText(node.label) ||
      !isName(node.actionId) ||
      !actions.has(node.actionId))
  )
    return 'invalid_action_reference';
  if (type === 'image') {
    if (++counter.images > 3) return 'exceeded_max_images';
    // 首期没有 Blob 长期引用保障，资源模式不允许静默丢图。
    if (hasOwn(node, 'resourceId') || !isName(node.bind))
      return 'unsupported_image_resource';
    if (hasOwn(data, node.bind) && !isSafeHttpUrl(data[node.bind]))
      return 'invalid_image_url';
  }
  if (type === 'card' || type === 'column' || type === 'row') {
    if (type === 'card' && depth !== 1) return 'nested_card_forbidden';
    if (!Array.isArray(node.children)) return 'invalid_children';
    if (type === 'row' && node.children.length > 3)
      return 'row_children_exceeded';
    for (const child of node.children) {
      const reason = validateTree(child, depth + 1, counter, actions, data);
      if (reason) return reason;
    }
  }
  return undefined;
}

/** 有界解析只接受协议数据；无论来自 HTTP、IPC 或本地数据库都执行相同校验。 */
export function parseTemplateSnapshot(input: unknown): ParsedTemplateResult {
  let target: unknown;
  try {
    if (typeof input === 'string') {
      if (new TextEncoder().encode(input).byteLength > MAX_TEMPLATE_BYTES)
        return {
          valid: false,
          fallbackText: '[模板消息] 内容暂不可用',
          errorReason: 'payload_too_large',
        };
      target = JSON.parse(input);
    } else {
      target = input;
    }
  } catch {
    return {
      valid: false,
      fallbackText: '[模板消息] 内容暂不可用',
      errorReason: 'corrupted_json',
    };
  }
  if (
    isObject(target) &&
    !hasOwn(target, 'schemaVersion') &&
    isObject(target.snapshot)
  )
    target = target.snapshot;
  const fallbackText = templateFallbackText(
    isObject(target) ? target.fallbackText : undefined,
  );
  const invalid = (errorReason: string): ParsedTemplateResult => ({
    valid: false,
    fallbackText,
    errorReason,
  });
  if (!isObject(target)) return invalid('corrupted_payload');
  try {
    const json = JSON.stringify(target);
    if (new TextEncoder().encode(json).byteLength > MAX_TEMPLATE_BYTES)
      return invalid('payload_too_large');
  } catch {
    return invalid('corrupted_payload');
  }
  if (target.schemaVersion !== TEMPLATE_SCHEMA_VERSION)
    return invalid('unsupported_schema_version');
  if (!isObject(target.layout) || target.layout.type !== 'card')
    return invalid('root_node_must_be_card');
  if (
    typeof target.templateId !== 'string' ||
    !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(target.templateId)
  )
    return invalid('invalid_template_id');
  if (
    !Number.isSafeInteger(target.templateVersion) ||
    Number(target.templateVersion) < 1
  )
    return invalid('invalid_template_version');
  if (hasOwn(target, 'templateName') && !isText(target.templateName, 80))
    return invalid('invalid_template_name');
  if (!isObject(target.data) || Object.keys(target.data).length > 30)
    return invalid('invalid_data');
  const data = target.data;
  for (const [name, value] of Object.entries(data)) {
    if (!isName(name)) return invalid('invalid_field_name');
    if (typeof value === 'string') {
      if (value.length > MAX_FIELD_TEXT_LENGTH)
        return invalid('field_text_too_long');
    } else if (typeof value === 'number') {
      if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)
        return invalid('unsafe_number');
    } else if (typeof value !== 'boolean')
      return invalid('invalid_field_value');
  }
  if (
    target.resources != null &&
    (!Array.isArray(target.resources) || target.resources.length > 0)
  )
    return invalid('unsupported_resources');
  if (target.actions != null && !Array.isArray(target.actions))
    return invalid('invalid_actions');
  const actions = new Map<string, TemplateAction>();
  const actionList = (target.actions ?? []) as unknown[];
  if (actionList.length > MAX_ACTIONS) return invalid('exceeded_max_actions');
  for (const action of actionList) {
    if (
      !isObject(action) ||
      Object.keys(action).some(
        (key) => !['bind', 'id', 'type'].includes(key),
      ) ||
      !isName(action.id) ||
      !isName(action.bind)
    )
      return invalid('invalid_action');
    if (actions.has(action.id)) return invalid('invalid_action_id');
    if (action.type !== 'openUrl' && action.type !== 'copyText')
      return invalid('unknown_action_type');
    if (
      hasOwn(data, action.bind) &&
      (typeof data[action.bind] !== 'string' ||
        (action.type === 'openUrl' && !isSafeHttpUrl(data[action.bind])))
    )
      return invalid('invalid_action_value');
    actions.set(action.id, {
      id: action.id,
      type: action.type,
      bind: action.bind,
    });
  }
  const reason = validateTree(
    target.layout,
    1,
    { nodes: 0, images: 0 },
    actions,
    data,
  );
  if (reason) return invalid(reason);
  return {
    valid: true,
    fallbackText,
    snapshot: {
      schemaVersion: TEMPLATE_SCHEMA_VERSION,
      templateId: target.templateId,
      templateVersion: Number(target.templateVersion),
      templateName: target.templateName as string | undefined,
      fallbackText,
      data,
      layout: target.layout as unknown as CardNode,
      actions: [...actions.values()],
    },
  };
}

export function extractTemplatePreview(input: unknown): string {
  return parseTemplateSnapshot(input).fallbackText;
}
