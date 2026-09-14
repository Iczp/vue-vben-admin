<script lang="ts" setup>
import type { UserDataDto } from '#/api/identity/user-lookup';

import { onMounted, ref, watch } from 'vue';

import { Select, Spin } from 'antdv-next';

import { getUserLookupByIdApi, searchUserLookupApi } from '#/api/identity/user-lookup';

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    placeholder?: string;
    value?: string;
  }>(),
  {
    allowClear: true,
    disabled: false,
    placeholder: '输入用户名/邮箱搜索用户...',
    value: undefined,
  },
);

const emit = defineEmits<{
  (e: 'change', val: string | undefined, item: undefined | UserDataDto): void;
  (e: 'update:value', val: string | undefined): void;
}>();

const loading = ref(false);
const options = ref<{ label: string; user: UserDataDto; value: string }[]>([]);
const internalValue = ref<string | undefined>(props.value);

let timer: null | ReturnType<typeof setTimeout> = null;

async function handleSearch(query: string) {
  if (timer) clearTimeout(timer);

  timer = setTimeout(async () => {
    loading.value = true;
    try {
      const res = await searchUserLookupApi({
        filter: query.trim() || undefined,
        maxResultCount: 20,
        skipCount: 0,
      });
      options.value = (res.items || []).map((u) => ({
        label: `${u.userName}${u.name ? ` (${u.name}${u.surname ? ` ${u.surname}` : ''})` : ''}${u.email ? ` - ${u.email}` : ''}`,
        user: u,
        value: u.id,
      }));
    } catch (error) {
      console.error('Failed to lookup users', error);
    } finally {
      loading.value = false;
    }
  }, 300);
}

function handleChange(val: any) {
  internalValue.value = val;
  const match = options.value.find((opt) => opt.value === val);
  emit('update:value', val);
  emit('change', val, match?.user);
}

// 若有回显需求，按 ID 补全 option
watch(
  () => props.value,
  async (newVal) => {
    internalValue.value = newVal;
    if (newVal && !options.value.some((o) => o.value === newVal)) {
      try {
        const u = await getUserLookupByIdApi(newVal);
        if (u) {
          options.value.push({
            label: `${u.userName}${u.name ? ` (${u.name})` : ''}`,
            user: u,
            value: u.id,
          });
        }
      } catch {
        // ignore
      }
    }
  },
  { immediate: true },
);

onMounted(() => {
  handleSearch('');
});
</script>

<template>
  <Select
    :value="internalValue"
    show-search
    :filter-option="false"
    :not-found-content="loading ? undefined : '未找到匹配用户'"
    :placeholder="placeholder"
    :allow-clear="allowClear"
    :disabled="disabled"
    :options="options"
    class="w-full"
    @search="handleSearch"
    @change="handleChange"
  >
    <template v-if="loading" #notFoundContent>
      <div class="p-2 text-center">
        <Spin size="small" />
      </div>
    </template>
  </Select>
</template>
