<script lang="ts" setup>
import type { LocationQueryRaw } from 'vue-router';

import type { AppStatisticQueryInput } from '#/api/app-statistic/types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Input as AInput,
  Alert,
  Row as ARow,
  Select as ASelect,
  Space as ASpace,
} from 'antdv-next';
import { RadioButton as ARadioButton } from 'antdv-next';
import { RadioGroup as ARadioGroup } from 'antdv-next';
import dayjs from 'dayjs';

import { getStatisticApplicationsApi } from '#/api/app-statistic/applications';
import type { StatisticApplicationDto } from '#/api/app-statistic/applications';
import { $t } from '#/locales';

import { getStoredAppId, setStoredAppId } from '../utils/app-storage';
import StatisticDateRange from './StatisticDateRange.vue';

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

const applications = ref<StatisticApplicationDto[]>([]);
const applicationsFailed = ref(false);
const appOptions = computed(() => applications.value.map(app => ({ label: app.name, value: app.appId })));
const timeZone = computed(() => applications.value.find(app => app.appId === internalQuery.value.appId)?.timeZone || 'UTC');
function onAppChange(value: unknown) {
  if (typeof value !== 'string') return;
  internalQuery.value.appId = value;
  setStoredAppId(value);
  const app = applications.value.find(item => item.appId === value);
  if (app && currentShortcut.value !== 'custom') {
    const span = Math.max(0, dayjs(internalQuery.value.endDate).diff(dayjs(internalQuery.value.startDate), 'day'));
    internalQuery.value.endDate = app.today;
    internalQuery.value.startDate = dayjs(app.today).subtract(span, 'day').format('YYYY-MM-DD');
  }
  handleSearch();
}
onMounted(async () => {
  try {
    applications.value = await getStatisticApplicationsApi();
    const storedAppId = getStoredAppId();
    const validStoredApp = storedAppId && applications.value.some(app => app.appId === storedAppId) ? storedAppId : undefined;
    const initialAppId =
      (typeof route.query.appId === 'string' && route.query.appId !== 'default' ? route.query.appId : undefined) ||
      (props.modelValue.appId && props.modelValue.appId !== 'default' ? props.modelValue.appId : undefined) ||
      validStoredApp ||
      (applications.value[0]?.appId);

    if (initialAppId && initialAppId !== internalQuery.value.appId) {
      onAppChange(initialAppId);
    } else if (initialAppId) {
      setStoredAppId(initialAppId);
    }
  } catch { applicationsFailed.value = true; }
});
const invalidRange = ref(false);
const currentShortcut = ref<string>('7d');

// Local query state
const initialStoredAppId = getStoredAppId();
const internalQuery = ref<AppStatisticQueryInput>({
  appId:
    (typeof route.query.appId === 'string' && route.query.appId !== 'default' ? route.query.appId : undefined) ||
    (props.modelValue.appId && props.modelValue.appId !== 'default' ? props.modelValue.appId : undefined) ||
    initialStoredAppId ||
    undefined,
  startDate:
    (typeof route.query.startDate === 'string' ? route.query.startDate : undefined) ||
    props.modelValue.startDate ||
    dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate:
    (typeof route.query.endDate === 'string' ? route.query.endDate : undefined) ||
    props.modelValue.endDate ||
    dayjs().format('YYYY-MM-DD'),
  platform: props.modelValue.platform || undefined,
  appVersion: props.modelValue.appVersion || undefined,
  channel: props.modelValue.channel || undefined,
});

const platformOptions = [
  { label: $t('appStatistic.text029'), value: '' },
  { label: 'Android', value: 'android' },
  { label: 'iOS', value: 'ios' },
  { label: 'Windows', value: 'windows' },
  { label: 'macOS', value: 'macos' },
  { label: 'Web', value: 'web' },
];

function onShortcutChange(e: { target: { value?: unknown } }) {
  if (typeof e.target.value === 'string') setDateShortcut(e.target.value);
}

function setDateShortcut(shortcut: string) {
  currentShortcut.value = shortcut;
  const today = dayjs(applications.value.find(app => app.appId === internalQuery.value.appId)?.today);
  let start: ReturnType<typeof dayjs>;
  let end: ReturnType<typeof dayjs>;

  switch (shortcut) {
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
    case 'lastMonth': {
      const lastMonth = today.subtract(1, 'month');
      start = lastMonth.startOf('month');
      end = lastMonth.endOf('month');
      break;
    }
    case 'thisMonth': {
      start = today.startOf('month');
      end = today;
      break;
    }
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
    default: {
      return;
    }
  }

  internalQuery.value.startDate = start.format('YYYY-MM-DD');
  internalQuery.value.endDate = end.format('YYYY-MM-DD');
  handleSearch();
}

function syncToUrl(query: AppStatisticQueryInput) {
  const nextQuery: LocationQueryRaw = { ...route.query };

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

  if (query.manufacturer) nextQuery.manufacturer = query.manufacturer;
  else delete nextQuery.manufacturer;

  const currentParams = new URLSearchParams(route.query as Record<string, string>).toString();
  const nextParams = new URLSearchParams(nextQuery as Record<string, string>).toString();

  if (currentParams !== nextParams) {
    router.replace({ query: nextQuery });
  }
}

function handleDateRangeChange(start: string, end: string) {
  internalQuery.value.startDate = start;
  internalQuery.value.endDate = end;
  currentShortcut.value = 'custom';
  handleSearch();
}

function handleSearch() {
  invalidRange.value =
    !dayjs(internalQuery.value.startDate).isValid() ||
    !dayjs(internalQuery.value.endDate).isValid() ||
    internalQuery.value.startDate > internalQuery.value.endDate ||
    dayjs(internalQuery.value.endDate).diff(
      dayjs(internalQuery.value.startDate),
      'day',
    ) > 92;
  if (invalidRange.value) return;
  const payload: AppStatisticQueryInput = {
    manufacturer: internalQuery.value.manufacturer,
    appId: internalQuery.value.appId?.trim() || undefined,
    startDate: internalQuery.value.startDate,
    endDate: internalQuery.value.endDate,
    platform: props.showPlatform
      ? internalQuery.value.platform || undefined
      : undefined,
    appVersion: props.showVersion
      ? internalQuery.value.appVersion?.trim() || undefined
      : undefined,
    channel: props.showChannel
      ? internalQuery.value.channel?.trim() || undefined
      : undefined,
  };

  syncToUrl(payload);
  emit('update:modelValue', payload);
  emit('change', payload);
}

function handleReset() {
  currentShortcut.value = '7d';
  const today = dayjs(applications.value.find(app => app.appId === internalQuery.value.appId)?.today);
  internalQuery.value = {
    appId: internalQuery.value.appId,
    startDate: today.subtract(6, 'day').format('YYYY-MM-DD'),
    endDate: today.format('YYYY-MM-DD'),
    platform: undefined,
    appVersion: undefined,
    channel: undefined,
  };
  handleSearch();
}

// Watch external modelValue changes
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      internalQuery.value = {
        appId: val.appId || internalQuery.value.appId || getStoredAppId(),
        startDate: val.startDate,
        endDate: val.endDate,
        platform: val.platform,
        appVersion: val.appVersion,
        channel: val.channel,
        manufacturer: val.manufacturer,
      };
      syncToUrl(internalQuery.value);
    }
  },
  { deep: true },
);

function readUrl() {
  const q = route.query;
  let changed = false;

  if (q.appId && typeof q.appId === 'string' && q.appId !== 'default') {
    if (internalQuery.value.appId !== q.appId) {
      internalQuery.value.appId = q.appId;
      setStoredAppId(q.appId);
      changed = true;
    }
  } else if (!internalQuery.value.appId) {
    const stored = getStoredAppId();
    if (stored) {
      internalQuery.value.appId = stored;
      changed = true;
    }
  }
  if (q.startDate && typeof q.startDate === 'string') {
    if (internalQuery.value.startDate !== q.startDate) {
      internalQuery.value.startDate = q.startDate;
      changed = true;
    }
  }
  if (q.endDate && typeof q.endDate === 'string') {
    if (internalQuery.value.endDate !== q.endDate) {
      internalQuery.value.endDate = q.endDate;
      changed = true;
    }
  }
  if (props.showPlatform && q.platform && typeof q.platform === 'string') {
    if (internalQuery.value.platform !== q.platform) {
      internalQuery.value.platform = q.platform;
      changed = true;
    }
  }
  if (props.showVersion && q.appVersion && typeof q.appVersion === 'string') {
    if (internalQuery.value.appVersion !== q.appVersion) {
      internalQuery.value.appVersion = q.appVersion;
      changed = true;
    }
  }
  if (props.showChannel && q.channel && typeof q.channel === 'string') {
    if (internalQuery.value.channel !== q.channel) {
      internalQuery.value.channel = q.channel;
      changed = true;
    }
  }

  if (typeof q.manufacturer === 'string') {
    if (internalQuery.value.manufacturer !== q.manufacturer) {
      internalQuery.value.manufacturer = q.manufacturer;
      changed = true;
    }
  }
  if (changed) {
    currentShortcut.value = 'custom';
    emit('update:modelValue', { ...internalQuery.value });
  }
}
readUrl();
watch(
  () => route.query,
  () => {
    readUrl();
  },
);
</script>

<template>
  <ACard :bordered="false" class="mb-4 shadow-sm" size="small">
    <Alert
      v-if="invalidRange"
      :message="$t('appStatistic.invalidRange')"
      type="warning"
      class="mb-2"
    />
    <Alert v-if="applicationsFailed" :message="$t('appStatistic.applicationsFailed')" type="warning" class="mb-2" />
    <div class="mb-2 text-xs text-muted-foreground">{{ $t('appStatistic.statisticsTimeZone', { zone: timeZone }) }}</div>
    <ARow :gutter="[16, 12]" align="middle">
      <!-- App ID -->
      <ACol v-if="showAppId" :lg="4" :md="6" :sm="12" :xs="24">
        <div class="flex items-center space-x-2">
          <span class="text-muted-foreground whitespace-nowrap text-xs">App:</span>
          <ASelect v-if="applications.length" v-model:value="internalQuery.appId" :options="appOptions" show-search option-filter-prop="label" size="small" class="w-full" @change="onAppChange" />
          <AInput v-else
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
          <span class="text-muted-foreground whitespace-nowrap text-xs">{{
            $t('appStatistic.text019')
          }}</span>
          <ASelect
            v-model:value="internalQuery.platform"
            :options="platformOptions"
            allow-clear
            class="w-full"
            :placeholder="$t('appStatistic.text029')"
            size="small"
            @change="handleSearch"
          />
        </div>
      </ACol>

      <!-- Version -->
      <ACol v-if="showVersion" :lg="4" :md="6" :sm="12" :xs="24">
        <div class="flex items-center space-x-2">
          <span class="text-muted-foreground whitespace-nowrap text-xs">{{
            $t('appStatistic.text020')
          }}</span>
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
          <span class="text-muted-foreground whitespace-nowrap text-xs">{{
            $t('appStatistic.text021')
          }}</span>
          <AInput
            v-model:value="internalQuery.channel"
            allow-clear
            :placeholder="$t('appStatistic.text068')"
            size="small"
            @press-enter="handleSearch"
          />
        </div>
      </ACol>

      <!-- Date Range & Shortcuts -->
      <ACol :lg="8" :md="12" :sm="24" :xs="24">
        <div class="flex flex-wrap items-center gap-2">
          <StatisticDateRange
            :start-date="internalQuery.startDate"
            :end-date="internalQuery.endDate"
            class="w-56"
            @change="handleDateRangeChange"
          />
        </div>
      </ACol>

      <!-- Date Quick Buttons & Search Actions -->
      <ACol :lg="24" :md="24" :sm="24" :xs="24">
        <div
          class="flex flex-wrap items-center justify-between gap-2 border-t pt-2"
        >
          <div class="flex flex-wrap items-center gap-1">
            <span class="text-muted-foreground mr-1 text-xs">{{
              $t('appStatistic.text022')
            }}</span>
            <ARadioGroup
              :value="currentShortcut"
              button-style="solid"
              size="small"
              @change="onShortcutChange"
            >
              <ARadioButton value="today">
                {{ $t('appStatistic.text023') }}
              </ARadioButton>
              <ARadioButton value="yesterday">
                {{ $t('appStatistic.text024') }}
              </ARadioButton>
              <ARadioButton value="7d">
                {{ $t('appStatistic.text025') }}
              </ARadioButton>
              <ARadioButton value="30d">
                {{ $t('appStatistic.text026') }}
              </ARadioButton>
              <ARadioButton value="thisMonth">
                {{ $t('appStatistic.text027') }}
              </ARadioButton>
              <ARadioButton value="lastMonth">
                {{ $t('appStatistic.text028') }}
              </ARadioButton>
            </ARadioGroup>
          </div>

          <ASpace size="small">
            <AButton
              :loading="loading"
              size="small"
              type="primary"
              @click="handleSearch"
            >
              {{ $t('appStatistic.text012') }}
            </AButton>
            <AButton size="small" @click="handleReset">
              {{ $t('appStatistic.text013') }}
            </AButton>
          </ASpace>
        </div>
      </ACol>
    </ARow>
  </ACard>
</template>
