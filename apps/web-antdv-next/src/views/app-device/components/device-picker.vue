<script setup lang="ts">
import type { AppDevice } from '#/api/modules/app-device';
import { computed, ref, watch } from 'vue';
import { Button, Input, Modal, Select, Table, message } from 'antdv-next';
import { getAppDevices } from '#/api/modules/app-device';
import { useCursorPage } from '../use-cursor-page';
import CursorPager from './cursor-pager.vue';

const props = withDefaults(defineProps<{ appId: string; multiple?: boolean; max?: number }>(), { multiple: true, max: 200 });
const emit = defineEmits<{ confirm: [devices: AppDevice[]] }>();
const open = defineModel<boolean>('open', { default: false });
const keyword = ref('');
const platform = ref<string>();
const selected = ref(new Map<string, AppDevice>());
const limit = computed(() => props.multiple ? props.max : 1);
const page = useCursorPage<AppDevice>((afterId, take) => getAppDevices({ appId: props.appId, afterId, take, keyword: keyword.value.trim() || undefined, platform: platform.value }));
const rowSelection = computed(() => ({
  type: props.multiple ? 'checkbox' as const : 'radio' as const,
  preserveSelectedRowKeys: true,
  selectedRowKeys: [...selected.value.keys()],
  getCheckboxProps: (record: AppDevice) => ({ disabled: props.multiple && selected.value.size >= limit.value && !selected.value.has(record.id) }),
  onChange: (keys: (number | string)[], rows: AppDevice[]) => {
    if (keys.length > limit.value) { message.warning(`最多选择 ${limit.value} 台设备`); return; }
    const values = new Map([...selected.value, ...rows.filter(Boolean).map((row) => [row.id, row] as const)]);
    selected.value = new Map(keys.flatMap((key) => { const row = values.get(String(key)); return row ? [[row.id, row] as const] : []; }));
  },
}));
watch([open, () => props.appId], () => {
  selected.value = new Map(); keyword.value = ''; platform.value = undefined;
  if (open.value && props.appId) void page.reset(); else page.clear();
});
const columns = [{ title: '设备名称', dataIndex: ['profile', 'name'] }, { title: 'DeviceId', dataIndex: 'deviceId', ellipsis: true }, { title: '平台', dataIndex: ['profile', 'platform'], width: 100 }, { title: '型号', dataIndex: ['profile', 'model'], width: 150 }];
function confirm() {
  if (!selected.value.size) return;
  emit('confirm', [...selected.value.values()]); open.value = false;
}
</script>
<template>
  <Modal v-model:open="open" title="选择设备" :width="960" :footer="null" :mask-closable="false">
    <div class="flex h-[540px] flex-col gap-3">
      <div class="flex gap-2">
        <Input.Search v-model:value="keyword" placeholder="设备名称 / DeviceId" :maxlength="128" allow-clear @search="page.reset" />
        <Select v-model:value="platform" placeholder="平台" class="w-40 shrink-0" allow-clear :options="['android', 'ios', 'windows', 'macos', 'web'].map((value) => ({ label: value, value }))" @change="page.reset" />
      </div>
      <div class="min-h-0 flex-1 overflow-auto">
        <Table row-key="id" size="small" :columns="columns" :data-source="page.items.value" :loading="page.loading.value" :row-selection="rowSelection" :pagination="false" :scroll="{ y: 330 }" />
      </div>
      <CursorPager :page="page.page.value" :take="page.take.value" :count="page.items.value.length" :has-next="page.hasNext.value" :has-previous="page.hasPrevious.value" :loading="page.loading.value" @next="page.next" @previous="page.previous" @resize="(value) => { page.take.value = value; page.reset(); }" />
      <div class="flex items-center justify-between border-t pt-3">
        <span>已选 {{ selected.size }} / {{ limit }} 台 <Button type="link" @click="selected.clear()">清空选择</Button></span>
        <div class="flex gap-2"><Button @click="open = false">取消</Button><Button type="primary" :disabled="!selected.size" @click="confirm">确定选择（{{ selected.size }}）</Button></div>
      </div>
    </div>
  </Modal>
</template>
