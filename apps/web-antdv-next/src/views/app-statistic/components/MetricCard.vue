<script lang="ts" setup>
import { computed } from 'vue';

import {
  Card as ACard,
  Skeleton as ASkeleton,
  Tooltip as ATooltip,
} from 'antdv-next';

interface Props {
  title: string;
  value: number | string;
  previousValue?: number | string;
  changeRate?: number;
  unit?: string;
  loading?: boolean;
  prefix?: string;
  tooltip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  previousValue: undefined,
  changeRate: undefined,
  unit: '',
  loading: false,
  prefix: '',
  tooltip: '',
});

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    return Number.isInteger(props.value)
      ? props.value.toLocaleString()
      : props.value.toFixed(2);
  }
  return props.value ?? '-';
});

const formattedPrevValue = computed(() => {
  if (props.previousValue === undefined || props.previousValue === null) {
    return null;
  }
  if (typeof props.previousValue === 'number') {
    return Number.isInteger(props.previousValue)
      ? props.previousValue.toLocaleString()
      : props.previousValue.toFixed(2);
  }
  return props.previousValue;
});

const isPositive = computed(() => (props.changeRate ?? 0) > 0);
const isNegative = computed(() => (props.changeRate ?? 0) < 0);
const formattedChangeRate = computed(() => {
  if (props.changeRate === undefined || props.changeRate === null) return null;
  const abs = Math.abs(props.changeRate).toFixed(1);
  return `${abs}%`;
});
</script>

<template>
  <ACard :bordered="false" class="h-full shadow-sm hover:shadow-md transition-shadow" size="small">
    <ASkeleton :loading="loading" :paragraph="{ rows: 2 }" active>
      <div class="flex flex-col justify-between">
        <!-- Title & Tooltip -->
        <div class="flex items-center justify-between text-muted-foreground text-xs">
          <span class="font-medium truncate">{{ title }}</span>
          <ATooltip v-if="tooltip" :title="tooltip">
            <span class="cursor-pointer text-muted-foreground hover:text-foreground">ⓘ</span>
          </ATooltip>
        </div>

        <!-- Value & Unit -->
        <div class="my-2 flex items-baseline space-x-1">
          <span v-if="prefix" class="text-sm font-medium">{{ prefix }}</span>
          <span class="text-2xl font-bold tracking-tight text-foreground">
            {{ formattedValue }}
          </span>
          <span v-if="unit" class="text-xs text-muted-foreground ml-1">{{ unit }}</span>
        </div>

        <!-- Change Rate & Previous Value -->
        <div class="flex items-center justify-between text-xs pt-1 border-t border-border/40">
          <div v-if="formattedChangeRate !== null" class="flex items-center space-x-1 font-medium">
            <span
              v-if="isPositive"
              class="text-emerald-600 dark:text-emerald-400 flex items-center"
            >
              <span class="mr-0.5">↑</span>
              <span>{{ formattedChangeRate }}</span>
            </span>
            <span
              v-else-if="isNegative"
              class="text-rose-600 dark:text-rose-400 flex items-center"
            >
              <span class="mr-0.5">↓</span>
              <span>{{ formattedChangeRate }}</span>
            </span>
            <span v-else class="text-muted-foreground">
              <span>持平 0.0%</span>
            </span>
          </div>
          <div v-else class="text-muted-foreground text-[11px]">-</div>

          <div v-if="formattedPrevValue !== null" class="text-muted-foreground text-[11px]">
            <span>对比 {{ formattedPrevValue }}</span>
          </div>
        </div>
      </div>
    </ASkeleton>
  </ACard>
</template>
