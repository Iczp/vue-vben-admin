<script setup lang="ts">
import { computed } from 'vue';

import { Copy, ExternalLink } from '@vben/icons';
import { message as antMessage } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    layout?: Record<string, any>;
    data?: Record<string, any>;
    actions?: Array<{ id: string; type: string; bind: string }>;
    templateName?: string;
  }>(),
  {
    layout: () => ({ type: 'card', children: [] }),
    data: () => ({}),
    actions: () => [],
    templateName: '',
  },
);

const dataObj = computed(() => props.data || {});
const layoutObj = computed(() => props.layout || { type: 'card', children: [] });
const actionsList = computed(() => props.actions || []);

function resolveValue(bind?: string): string {
  if (!bind) return '';
  const val = dataObj.value[bind];
  return val === undefined || val === null ? '' : String(val);
}

function findAction(actionId: string) {
  return actionsList.value.find((a) => a.id === actionId);
}

function handleAction(actionId: string) {
  const act = findAction(actionId);
  if (!act) return;
  const val = resolveValue(act.bind);
  if (!val) {
    antMessage.warning('动作绑定的数据为空');
    return;
  }
  if (act.type === 'copyText') {
    navigator.clipboard?.writeText(val);
    antMessage.success(`已复制: ${val}`);
  } else if (act.type === 'openUrl') {
    window.open(val, '_blank');
  }
}
</script>

<template>
  <div class="template-preview-card">
    <!-- Header -->
    <div v-if="props.templateName" class="card-header">
      <span class="card-tag">模板</span>
      <span class="card-title">{{ props.templateName }}</span>
    </div>

    <!-- Body -->
    <div class="card-body">
      <template v-for="(child, idx) in layoutObj.children || []" :key="idx">
        <!-- text -->
        <div
          v-if="child.type === 'text'"
          class="node-text"
          :class="`text-${child.style || 'body'}`"
        >
          {{ child.text || resolveValue(child.bind) }}
        </div>

        <!-- field -->
        <div
          v-else-if="child.type === 'field' && resolveValue(child.bind)"
          class="node-field"
        >
          <span class="field-label">{{ child.label }}</span>
          <span class="field-value">{{ resolveValue(child.bind) }}</span>
        </div>

        <!-- badge -->
        <div
          v-else-if="child.type === 'badge' && (child.text || resolveValue(child.bind))"
          class="node-badge"
        >
          <span class="badge-pill" :class="`tone-${child.tone || 'neutral'}`">
            {{ child.text || resolveValue(child.bind) }}
          </span>
        </div>

        <!-- image -->
        <div
          v-else-if="child.type === 'image' && resolveValue(child.bind)"
          class="node-image"
          :class="`aspect-${child.aspectRatio || 'landscape'}`"
        >
          <img :src="resolveValue(child.bind)" alt="preview" />
        </div>

        <!-- divider -->
        <div v-else-if="child.type === 'divider'" class="node-divider" />

        <!-- row -->
        <div
          v-else-if="child.type === 'row'"
          class="node-row"
          :class="`gap-${child.gap || 'medium'}`"
        >
          <template v-for="(rChild, rIdx) in (child.children || []).slice(0, 3)" :key="rIdx">
            <div
              v-if="rChild.type === 'text'"
              class="node-text row-item"
              :class="`text-${rChild.style || 'body'}`"
            >
              {{ rChild.text || resolveValue(rChild.bind) }}
            </div>
            <div
              v-else-if="rChild.type === 'field' && resolveValue(rChild.bind)"
              class="node-field row-item"
            >
              <span class="field-label">{{ rChild.label }}</span>
              <span class="field-value">{{ resolveValue(rChild.bind) }}</span>
            </div>
            <div
              v-else-if="rChild.type === 'badge' && (rChild.text || resolveValue(rChild.bind))"
              class="node-badge row-item"
            >
              <span class="badge-pill" :class="`tone-${rChild.tone || 'neutral'}`">
                {{ rChild.text || resolveValue(rChild.bind) }}
              </span>
            </div>
            <button
              v-else-if="rChild.type === 'button' && findAction(rChild.actionId) && resolveValue(findAction(rChild.actionId)?.bind)"
              type="button"
              class="preview-btn row-item"
              @click="handleAction(rChild.actionId)"
            >
              <ExternalLink v-if="findAction(rChild.actionId)?.type === 'openUrl'" />
              <Copy v-else />
              <span>{{ rChild.label }}</span>
            </button>
          </template>
        </div>

        <!-- column -->
        <div
          v-else-if="child.type === 'column'"
          class="node-column"
          :class="`gap-${child.gap || 'medium'}`"
        >
          <template v-for="(cChild, cIdx) in child.children || []" :key="cIdx">
            <div
              v-if="cChild.type === 'text'"
              class="node-text"
              :class="`text-${cChild.style || 'body'}`"
            >
              {{ cChild.text || resolveValue(cChild.bind) }}
            </div>
            <div
              v-else-if="cChild.type === 'field' && resolveValue(cChild.bind)"
              class="node-field"
            >
              <span class="field-label">{{ cChild.label }}</span>
              <span class="field-value">{{ resolveValue(cChild.bind) }}</span>
            </div>
            <div
              v-else-if="cChild.type === 'badge' && (cChild.text || resolveValue(cChild.bind))"
              class="node-badge"
            >
              <span class="badge-pill" :class="`tone-${cChild.tone || 'neutral'}`">
                {{ cChild.text || resolveValue(cChild.bind) }}
              </span>
            </div>
          </template>
        </div>

        <!-- button -->
        <button
          v-else-if="child.type === 'button' && findAction(child.actionId) && resolveValue(findAction(child.actionId)?.bind)"
          type="button"
          class="preview-btn block-btn"
          @click="handleAction(child.actionId)"
        >
          <ExternalLink v-if="findAction(child.actionId)?.type === 'openUrl'" />
          <Copy v-else />
          <span>{{ child.label }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.template-preview-card {
  width: 100%;
  max-width: 340px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.card-tag {
  font-size: 11px;
  padding: 1px 5px;
  border-radius: 4px;
  background: #e6f4ff;
  color: #1677ff;
  font-weight: 500;
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-text {
  word-break: break-word;
  line-height: 1.5;
}

.text-heading {
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
}

.text-body {
  font-size: 13px;
  color: #262626;
}

.text-secondary {
  font-size: 12px;
  color: #8c8c8c;
}

.node-field {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 13px;
  line-height: 1.4;
  gap: 12px;
}

.field-label {
  color: #8c8c8c;
  flex-shrink: 0;
}

.field-value {
  color: #262626;
  font-weight: 500;
  text-align: right;
  word-break: break-all;
}

.node-badge {
  display: inline-flex;
}

.badge-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.tone-neutral {
  background: #f0f0f0;
  color: #595959;
}

.tone-success {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.tone-warning {
  background: #fffbe6;
  color: #faad14;
  border: 1px solid #ffe58f;
}

.tone-danger {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.node-image {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;
}

.node-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.aspect-square {
  aspect-ratio: 1 / 1;
}

.aspect-landscape {
  aspect-ratio: 16 / 9;
}

.aspect-portrait {
  aspect-ratio: 3 / 4;
}

.node-divider {
  width: 100%;
  height: 1px;
  background: #f0f0f0;
  margin: 4px 0;
}

.node-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.node-column {
  display: flex;
  flex-direction: column;
}

.gap-small {
  gap: 4px;
}

.gap-medium {
  gap: 8px;
}

.gap-large {
  gap: 16px;
}

.row-item {
  flex: 1 1 0;
  min-width: 0;
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #1677ff;
  background: #f0f7ff;
  border: 1px solid #bae0ff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.preview-btn:hover {
  background: #e6f4ff;
  border-color: #91caff;
}

.block-btn {
  width: 100%;
  margin-top: 4px;
}
</style>
