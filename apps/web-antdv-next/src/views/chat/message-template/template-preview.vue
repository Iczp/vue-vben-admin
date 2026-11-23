<script setup lang="ts">
import type { TemplateNode, TemplateSnapshot } from './template-message';

import { computed, h } from 'vue';

import {
  formatTemplateValue,
  isSafeHttpUrl,
  parseTemplateSnapshot,
} from './template-message';

const props = defineProps<{ snapshot: unknown }>();
const parsed = computed(() => parseTemplateSnapshot(props.snapshot));
function renderNode(
  node: TemplateNode,
  snapshot: TemplateSnapshot,
): null | ReturnType<typeof h> {
  const data = snapshot.data;
  const value = 'bind' in node ? data[node.bind || ''] : undefined;
  if (['card', 'column', 'row'].includes(node.type)) {
    const container = node as Extract<
      TemplateNode,
      { children: TemplateNode[] }
    >;
    const gap = 'gap' in container ? container.gap : 'medium';
    return h(
      'div',
      { class: [`node-${node.type}`, `gap-${gap || 'medium'}`] },
      container.children.map((child) => renderNode(child, snapshot)),
    );
  }
  if (node.type === 'text')
    return h(
      'p',
      { class: `text-${node.style || 'body'}` },
      node.text ?? formatTemplateValue(value),
    );
  if (node.type === 'field')
    return value === undefined || value === null
      ? null
      : h('div', { class: 'node-field' }, [
          h('span', node.label),
          h('span', formatTemplateValue(value)),
        ]);
  if (node.type === 'badge')
    return h(
      'span',
      { class: `tone-${node.tone || 'neutral'}` },
      node.text ?? formatTemplateValue(value),
    );
  if (node.type === 'divider') return h('hr');
  if (node.type === 'image')
    return h(
      'div',
      { class: `node-image aspect-${node.aspectRatio || 'landscape'}` },
      isSafeHttpUrl(value)
        ? [
            h('img', {
              src: value,
              alt: '模板图片',
              referrerpolicy: 'no-referrer',
              onError: (event: Event) => {
                (event.target as HTMLImageElement).hidden = true;
              },
            }),
          ]
        : '图片暂不可用',
    );
  if (node.type === 'button') {
    const action = snapshot.actions?.find((a) => a.id === node.actionId);
    if (
      !action ||
      data[action.bind] === undefined ||
      data[action.bind] === null ||
      data[action.bind] === ''
    )
      return null;
    // 编辑预览只展示按钮，不执行链接或复制，实际聊天动作由客户端安全入口处理。
    return h(
      'button',
      { type: 'button', disabled: true, title: '预览模式不执行动作' },
      node.label,
    );
  }
  return null;
}
const PreviewTree = () =>
  parsed.value.valid && parsed.value.snapshot
    ? renderNode(parsed.value.snapshot.layout, parsed.value.snapshot)
    : h('p', { role: 'status' }, parsed.value.fallbackText);
</script>

<template>
  <div class="template-preview"><PreviewTree /></div>
</template>

<style scoped>
.template-preview {
  max-width: 360px;
  padding: 16px;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  overflow-wrap: anywhere;
}
.template-preview :deep(.node-card),
.template-preview :deep(.node-column) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.template-preview :deep(.node-row) {
  display: flex;
  flex-wrap: wrap;
  align-items: start;
}
.template-preview :deep(.node-row > *) {
  flex: 1 1 100px;
  min-width: 0;
}
.template-preview :deep(.node-field) {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}
.template-preview :deep(.gap-small) {
  gap: 4px;
}
.template-preview :deep(.gap-medium) {
  gap: 8px;
}
.template-preview :deep(.gap-large) {
  gap: 16px;
}
.template-preview :deep(.text-heading) {
  font-size: 1.15em;
  font-weight: 600;
}
.template-preview :deep(.text-secondary) {
  opacity: 0.65;
}
.template-preview :deep(.tone-warning) {
  color: #b45309;
}
.template-preview :deep(.tone-success) {
  color: #15803d;
}
.template-preview :deep(.tone-danger) {
  color: #dc2626;
}
.template-preview :deep(.node-image) {
  background: hsl(var(--muted));
  width: 100%;
  overflow: hidden;
}
.template-preview :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.template-preview :deep(.aspect-landscape) {
  aspect-ratio: 16 / 9;
}
.template-preview :deep(.aspect-square) {
  aspect-ratio: 1;
}
.template-preview :deep(.aspect-portrait) {
  aspect-ratio: 3 / 4;
}
</style>
