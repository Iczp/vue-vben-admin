<script lang="ts" setup>
import { computed } from 'vue';

import {
  Card as ACard,
  Spin as ASpin,
  Table as ATable,
  Tooltip as ATooltip,
} from 'ant-design-vue';

import type { RetentionDto } from '#/api/app-statistic/types';

import StatisticEmpty from './StatisticEmpty.vue';

interface Props {
  data: RetentionDto[];
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false,
});

interface CohortRow {
  cohortDate: string;
  baseUsers: number;
  d1?: RetentionDto;
  d3?: RetentionDto;
  d7?: RetentionDto;
  d14?: RetentionDto;
  d30?: RetentionDto;
}

const tableData = computed<CohortRow[]>(() => {
  if (!props.data || props.data.length === 0) return [];

  const map = new Map<string, CohortRow>();

  props.data.forEach((item) => {
    const date = item.cohortDate;
    if (!map.has(date)) {
      map.set(date, {
        cohortDate: date,
        baseUsers: item.baseUsers,
      });
    }
    const row = map.get(date)!;
    if (item.baseUsers > row.baseUsers) {
      row.baseUsers = item.baseUsers;
    }

    if (item.retentionDay === 1) row.d1 = item;
    else if (item.retentionDay === 3) row.d3 = item;
    else if (item.retentionDay === 7) row.d7 = item;
    else if (item.retentionDay === 14) row.d14 = item;
    else if (item.retentionDay === 30) row.d30 = item;
  });

  return Array.from(map.values()).sort(
    (a, b) => b.cohortDate.localeCompare(a.cohortDate),
  );
});

function getCellStyle(item?: RetentionDto) {
  if (!item || item.retentionRate === undefined) {
    return { backgroundColor: 'transparent' };
  }
  const rate = Math.min(100, Math.max(0, item.retentionRate));
  const alpha = Math.max(0.08, (rate / 100) * 0.85);
  return {
    backgroundColor: `rgba(22, 119, 255, ${alpha.toFixed(2)})`,
    color: alpha > 0.5 ? '#fff' : 'inherit',
    fontWeight: '500',
  };
}

const columns = [
  {
    title: '基准日期',
    dataIndex: 'cohortDate',
    key: 'cohortDate',
    width: 120,
    fixed: 'left' as const,
  },
  {
    title: '基准用户',
    dataIndex: 'baseUsers',
    key: 'baseUsers',
    width: 100,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '1日后',
    dataIndex: 'd1',
    key: 'd1',
    width: 90,
    align: 'center' as const,
  },
  {
    title: '3日后',
    dataIndex: 'd3',
    key: 'd3',
    width: 90,
    align: 'center' as const,
  },
  {
    title: '7日后',
    dataIndex: 'd7',
    key: 'd7',
    width: 90,
    align: 'center' as const,
  },
  {
    title: '14日后',
    dataIndex: 'd14',
    key: 'd14',
    width: 90,
    align: 'center' as const,
  },
  {
    title: '30日后',
    dataIndex: 'd30',
    key: 'd30',
    width: 90,
    align: 'center' as const,
  },
];
</script>

<template>
  <ACard :bordered="false" class="mb-4 shadow-sm" size="small">
    <template #title>
      <div class="flex items-center justify-between py-1">
        <span class="font-medium text-sm">留存矩阵 (Cohort Heatmap)</span>
        <span class="text-xs text-muted-foreground">
          颜色深度代表留存率高低
        </span>
      </div>
    </template>

    <ASpin :spinning="loading">
      <div v-if="tableData.length > 0" class="overflow-x-auto">
        <ATable
          :columns="columns"
          :data-source="tableData"
          :pagination="false"
          bordered
          row-key="cohortDate"
          size="small"
        >
          <template #bodyCell="{ column, record }">
            <template
              v-if="['d1', 'd3', 'd7', 'd14', 'd30'].includes(String(column.dataIndex))"
            >
              <div
                v-if="record[column.dataIndex as keyof CohortRow]"
                :style="getCellStyle(record[column.dataIndex as keyof CohortRow] as RetentionDto)"
                class="py-1 px-2 rounded text-center transition-colors"
              >
                <ATooltip
                  :title="`留存人数: ${(record[column.dataIndex as keyof CohortRow] as RetentionDto).retainedUsers?.toLocaleString()} / 基准: ${(record[column.dataIndex as keyof CohortRow] as RetentionDto).baseUsers?.toLocaleString()}`"
                >
                  <span>
                    {{
                      (
                        record[column.dataIndex as keyof CohortRow] as RetentionDto
                      ).retentionRate?.toFixed(1)
                    }}%
                  </span>
                </ATooltip>
              </div>
              <span v-else class="text-muted-foreground/40 text-xs">-</span>
            </template>
          </template>
        </ATable>
      </div>
      <StatisticEmpty v-else-if="!loading" />
    </ASpin>
  </ACard>
</template>
