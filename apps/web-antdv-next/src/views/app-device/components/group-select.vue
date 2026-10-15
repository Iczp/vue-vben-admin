<script setup lang="ts">
import type { DeviceGroup } from '#/api/modules/app-device';

import { ref, watch } from 'vue';

import { Button, Select } from 'antdv-next';

import { getAppDeviceGroups } from '#/api/modules/app-device';

import { useCursorPage } from '../use-cursor-page';
const props = defineProps<{ appId: string }>();
const emit = defineEmits<{ loaded: [groups: DeviceGroup[]] }>();
const model = defineModel<string>();
const options = ref<DeviceGroup[]>([]);
const page = useCursorPage<DeviceGroup>((afterId, take) =>
  getAppDeviceGroups(props.appId, { afterId, take }),
);
page.take.value = 200;
watch(page.items, (items) => {
  options.value = [
    ...new Map([...options.value, ...items].map((g) => [g.id, g])).values(),
  ];
  emit('loaded', options.value);
});
watch(
  () => props.appId,
  () => {
    options.value = [];
    model.value = undefined;
    if (props.appId) void page.reset();
    else page.clear();
  },
  { immediate: true },
);
</script>
<template>
  <div class="flex items-center gap-1">
    <Select
      v-model:value="model"
      aria-label="分组"
      placeholder="选择分组"
      class="w-52"
      allow-clear
      show-search
      option-filter-prop="label"
      :loading="page.loading.value"
      :options="options.map((g) => ({ label: g.name, value: g.id }))"
    />
    <Button
      v-if="page.hasNext.value || page.failed.value"
      type="link"
      :loading="page.loading.value"
      @click="page.failed.value ? page.load() : page.next()"
    >
      {{ page.failed.value ? '重试分组查询' : '更多分组' }}
    </Button>
  </div>
</template>
