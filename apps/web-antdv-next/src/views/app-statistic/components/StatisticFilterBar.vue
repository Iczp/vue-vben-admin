<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Input as AInput,
  Radio as ARadio,
  RangePicker as ARangePicker,
  Row as ARow,
  Select as ASelect,
  Space as ASpace,
} from 'antdv-next';
import dayjs from 'dayjs';

import type { AppStatisticQueryInput } from '#/api/app-statistic/types';

interface Props {
  modelValue: AppStatisticQueryInput;
  showPlatform?: boolean;
  showVersion?: boolean;
  showChannel?: boolean;
  showAppId?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPlatform: true,
  showVersion: true,
  showChannel: true,
  showAppId: true,
  loading: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: AppStatisticQueryInput): void;
  (e: 'change', value: AppStatisticQueryInput): void;
  (e: 'reset'): void;
}>();

const route = useRoute();
const router = useRouter();

const currentShortcut = ref<string>('7d');

// Local query state
const internalQuery = ref<AppStatisticQueryInput>({
  appId: props.modelValue.appId || 'default',
  startDate:
    props.modelValue.startDate ||
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate: props.modelValue.endDate || dayjs().format('YYYY-MM-DD'),
  platform: props.modelValue.platform || undefined,
  appVersion: props.modelValue.appVersion || undefined,
  channel: props.modelValue.channel || undefined,
});

const platformOptions = [
  { label: '全部平台', value: '' },
  { label: 'Android', value: 'android' },
  { label: 'iOS', value: 'ios' },
  { label: 'Windows', value: 'windows' },
  { label: 'macOS', value: 'macos' },
  { label: 'Web', value: 'web' },
];

function setDateShortcut(shortcut: string) {
  currentShortcut.value = shortcut;
  const today = dayjs();
  let start = today;
  let end = today;

  switch (shortcut) {
    case 'today': {
      start = today;
      end = today;
      break;
    }
    case 'yesterday': {
      start = today.subtract(1, 'day');
      end = today.subtract(1, 'day');
      break;
    }
    case '7d': {
      start = today.subtract(6, 'day');
      end = today;
      break;
    }
    case '30d': {
      start = today.subtract(29, 'day');
      end = today;
      break;
    }
    case 'thisMonth': {
      start = today.startOf('month');
      end = today;
      break;
    }
    case 'lastMonth': {
      const lastMonth = today.subtract(1, 'month');
      start = lastMonth.startOf('month');
      end = lastMonth.endOf('month');
      break;
    }
    default: {
      return;
    }
  }

  internalQuery.value.startDate = start.format('YYYY-MM-DD');
  internalQuery.value.endDate = end.format('YYYY-MM-DD');
  handleSearch();
}

function syncToUrl(query: AppStatisticQueryInput) {
  const nextQuery: Record<string, any> = { ...route.query };

  if (query.appId && query.appId !== 'default') {
    nextQuery.appId = query.appId;
  } else {
    delete nextQuery.appId;
  }

  if (query.startDate) nextQuery.startDate = query.startDate;
  if (query.endDate) nextQuery.endDate = query.endDate;

  if (query.platform) {
    nextQuery.platform = query.platform;
  } else {
    delete nextQuery.platform;
  }

  if (query.appVersion) {
    nextQuery.appVersion = query.appVersion;
  } else {
    delete nextQuery.appVersion;
  }

  if (query.channel) {
    nextQuery.channel = query.channel;
  } else {
    delete nextQuery.channel;
  }

  router.replace({ query: nextQuery });
}

function handleDateRangeChange(dates: any) {
  if (dates && dates[0] && dates[1]) {
    internalQuery.value.startDate = dates[0].format('YYYY-MM-DD');
    internalQuery.value.endDate = dates[1].format('YYYY-MM-DD');
    currentShortcut.value = 'custom';
    handleSearch();
  }
}

function handleSearch() {
  const payload: AppStatisticQueryInput = {
    appId: internalQuery.value.appId?.trim() || 'default',
    startDate: internalQuery.value.startDate,
    endDate: internalQuery.value.endDate,
    platform: internalQuery.value.platform || undefined,
    appVersion: internalQuery.value.appVersion?.trim() || undefined,
    channel: internalQuery.value.channel?.trim() || undefined,
  };

  syncToUrl(payload);
  emit('update:modelValue', payload);
  emit('change', payload);
}

function handleReset() {
  currentShortcut.value = '7d';
  const today = dayjs();
  internalQuery.value = {
    appId: 'default',
    startDate: today.subtract(6, 'day').format('YYYY-MM-DD'),
    endDate: today.format('YYYY-MM-DD'),
    platform: undefined,
    appVersion: undefined,
    channel: undefined,
  };
  handleSearch();
  emit('reset');
}

// Watch external modelValue changes
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      internalQuery.value = {
        appId: val.appId || 'default',
        startDate: val.startDate,
        endDate: val.endDate,
        platform: val.platform,
        appVersion: val.appVersion,
        channel: val.channel,
      };
    }
  },
  { deep: true },
);

onMounted(() => {
  const q = route.query;
  let changed = false;

  if (q.appId && typeof q.appId === 'string') {
    internalQuery.value.appId = q.appId;
    changed = true;
  }
  if (q.startDate && typeof q.startDate === 'string') {
    internalQuery.value.startDate = q.startDate;
    changed = true;
  }
  if (q.endDate && typeof q.endDate === 'string') {
    internalQuery.value.endDate = q.endDate;
    changed = true;
  }
  if (q.platform && typeof q.platform === 'string') {
    internalQuery.value.platform = q.platform;
    changed = true;
  }
  if (q.appVersion && typeof q.appVersion === 'string') {
    internalQuery.value.appVersion = q.appVersion;
    changed = true;
  }
  if (q.channel && typeof q.channel === 'string') {
    internalQuery.value.channel = q.channel;
    changed = true;
  }

  if (changed) {
    currentShortcut.value = 'custom';
    handleSearch();
  }
});
</script>

<template>
  <ACard :bordered="false" class="mb-4 shadow-sm" size="small">
    <ARow :gutter="[16, 12]" align="middle">
      <!-- App ID -->
      <ACol v-if="showAppId" :lg="4" :md="6" :sm="12" :xs="24">
        <div class="flex items-center space-x-2">
          <span class="text-muted-foreground whitespace-nowrap text-xs">App:</span>
          <AInput
            v-model:value="internalQuery.appId"
            allow-clear
            placeholder="AppId"
            size="small"
            @press-enter="handleSearch"
          />
        </div>
      </ACol>

      <!-- Platform -->
      <ACol v-if="showPlatform" :lg="4" :md="6" :sm="12" :xs="24">
        <div class="flex items-center space-x-2">
          <span class="text-muted-foreground whitespace-nowrap text-xs">平台:</span>
          <ASelect
            v-model:value="internalQuery.platform"
            :options="platformOptions"
            allow-clear
            class="w-full"
            placeholder="全部平台"
            size="small"
            @change="handleSearch"
          />
        </div>
      </ACol>

      <!-- Version -->
      <ACol v-if="showVersion" :lg="4" :md="6" :sm="12" :xs="24">
        <div class="flex items-center space-x-2">
          <span class="text-muted-foreground whitespace-nowrap text-xs">版本:</span>
          <AInput
            v-model:value="internalQuery.appVersion"
            allow-clear
            placeholder="AppVersion"
            size="small"
            @press-enter="handleSearch"
          />
        </div>
      </ACol>

      <!-- Channel -->
      <ACol v-if="showChannel" :lg="4" :md="6" :sm="12" :xs="24">
        <div class="flex items-center space-x-2">
          <span class="text-muted-foreground whitespace-nowrap text-xs">渠道:</span>
          <AInput
            v-model:value="internalQuery.channel"
            allow-clear
            placeholder="渠道名称"
            size="small"
            @press-enter="handleSearch"
          />
        </div>
      </ACol>

      <!-- Date Range & Shortcuts -->
      <ACol :lg="8" :md="12" :sm="24" :xs="24">
        <div class="flex flex-wrap items-center gap-2">
          <ARangePicker
            :allow-clear="false"
            :value="[dayjs(internalQuery.startDate), dayjs(internalQuery.endDate)]"
            class="w-56"
            format="YYYY-MM-DD"
            size="small"
            @change="handleDateRangeChange"
          />
        </div>
      </ACol>

      <!-- Date Quick Buttons & Search Actions -->
      <ACol :lg="24" :md="24" :sm="24" :xs="24">
        <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-muted-foreground mr-1 text-xs">快捷范围:</span>
            <ARadio.Group
              :value="currentShortcut"
              button-style="solid"
              size="small"
              @change="(e) => setDateShortcut(e.target.value)"
            >
              <ARadio.Button value="today">今天</ARadio.Button>
              <ARadio.Button value="yesterday">昨天</ARadio.Button>
              <ARadio.Button value="7d">近7天</ARadio.Button>
              <ARadio.Button value="30d">近30天</ARadio.Button>
              <ARadio.Button value="thisMonth">本月</ARadio.Button>
              <ARadio.Button value="lastMonth">上月</ARadio.Button>
            </ARadio.Group>
          </div>

          <ASpace size="small">
            <AButton :loading="loading" size="small" type="primary" @click="handleSearch">
              查询
            </AButton>
            <AButton size="small" @click="handleReset">重置</AButton>
          </ASpace>
        </div>
      </ACol>
    </ARow>
  </ACard>
</template>
