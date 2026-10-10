<script lang="ts" setup>
import type { DeviceDto } from '#/api/app-statistic/types';

import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { message, Tooltip as ATooltip } from 'antdv-next';

import { getDeviceDisplayName, lookupDevice } from '../utils/device-lookup';
import {
  AndroidIcon,
  AppleIcon,
  CopyIcon,
  MonitorIcon,
  SmartphoneIcon,
  WindowsIcon,
} from '../utils/icons';

interface Props {
  device?: Partial<DeviceDto> | null;
  deviceId?: string;
  deviceKey?: string;
  showCopy?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  device: undefined,
  deviceId: undefined,
  deviceKey: undefined,
  showCopy: true,
  clickable: true,
});

const router = useRouter();
const fetchedDevice = ref<DeviceDto | null>(null);

const activeDevice = computed<Partial<DeviceDto> | null>(() => {
  return props.device || fetchedDevice.value;
});

const resolvedId = computed(() => {
  return props.deviceId || activeDevice.value?.id;
});

const resolvedKey = computed(() => {
  return props.deviceKey || activeDevice.value?.deviceKey;
});

const deviceName = computed(() => {
  return getDeviceDisplayName(activeDevice.value);
});

const platform = computed(() => {
  return activeDevice.value?.platform?.toLowerCase();
});

async function fetchInfo() {
  if (props.device) return;
  if (!props.deviceId || props.deviceId === '00000000-0000-0000-0000-000000000000') {
    fetchedDevice.value = null;
    return;
  }
  try {
    fetchedDevice.value = await lookupDevice(props.deviceId);
  } catch {
    fetchedDevice.value = null;
  }
}

watch(() => props.deviceId, fetchInfo);
onMounted(fetchInfo);

async function copyIdentifier() {
  const text = resolvedKey.value || resolvedId.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success('设备标识已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

function handleClick() {
  if (!props.clickable || !resolvedId.value) return;
  router.push(`/app-statistic/devices/${resolvedId.value}`);
}
</script>

<template>
  <div
    class="inline-flex flex-col text-left py-0.5 group"
    :class="{ 'cursor-pointer': clickable && resolvedId }"
    @click="handleClick"
  >
    <!-- 设备名称与平台图标 -->
    <div class="flex items-center gap-1 font-medium text-foreground text-xs leading-snug">
      <!-- 平台图标 -->
      <AppleIcon v-if="platform === 'ios'" class="text-xs text-foreground/80 shrink-0 size-3.5" />
      <AndroidIcon v-else-if="platform === 'android'" class="text-xs text-emerald-600 shrink-0 size-3.5" />
      <WindowsIcon v-else-if="platform === 'windows'" class="text-xs text-blue-500 shrink-0 size-3.5" />
      <MonitorIcon v-else-if="platform === 'web' || platform === 'macos'" class="text-xs text-muted-foreground shrink-0 size-3.5" />
      <SmartphoneIcon v-else class="text-xs text-muted-foreground shrink-0 size-3.5" />

      <span
        class="truncate max-w-[150px] group-hover:text-primary transition-colors"
        :title="deviceName"
      >
        {{ deviceName }}
      </span>
    </div>

    <!-- 设备 Key / 设备 ID -->
    <div class="flex items-center gap-1 text-[11px] text-muted-foreground leading-snug mt-0.5">
      <ATooltip :title="resolvedKey ? `DeviceKey: ${resolvedKey}` : `设备 ID: ${resolvedId}`">
        <span class="font-mono text-muted-foreground/80 truncate max-w-[120px]">
          <template v-if="resolvedKey">
            {{ resolvedKey.slice(0, 10) }}...{{ resolvedKey.slice(-4) }}
          </template>
          <template v-else-if="resolvedId">
            {{ resolvedId.slice(0, 8) }}...{{ resolvedId.slice(-4) }}
          </template>
          <template v-else>-</template>
        </span>
      </ATooltip>

      <ATooltip v-if="showCopy && (resolvedKey || resolvedId)" title="复制设备唯一标识">
        <CopyIcon
          class="text-xs cursor-pointer text-muted-foreground/60 hover:text-primary transition-colors size-3"
          @click.stop="copyIdentifier"
        />
      </ATooltip>
    </div>
  </div>
</template>
