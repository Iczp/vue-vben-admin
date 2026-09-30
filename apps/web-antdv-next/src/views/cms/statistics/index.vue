<script lang="ts" setup>
import type { ContentDailyStatDto } from '#/api/cms';

import { computed, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Statistic,
} from 'antdv-next';
import dayjs from 'dayjs';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getDailyStatsApi } from '#/api/cms';

import { useColumns } from './data';

const dateRange = ref<any>([dayjs().subtract(30, 'day'), dayjs()]);

const filters = reactive<{
  entityType?: string;
}>({
  entityType: undefined,
});

const statList = ref<ContentDailyStatDto[]>([]);

const totalPv = computed(() =>
  statList.value.reduce((acc, curr) => acc + (curr.viewCount || 0), 0),
);
const totalUv = computed(() =>
  statList.value.reduce((acc, curr) => acc + (curr.uniqueVisitorCount || 0), 0),
);
const totalLikes = computed(() =>
  statList.value.reduce((acc, curr) => acc + (curr.likeCount || 0), 0),
);
const totalComments = computed(() =>
  statList.value.reduce((acc, curr) => acc + (curr.commentCount || 0), 0),
);

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [10, 15, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          const startDate = dateRange.value?.[0]
            ? dateRange.value[0].format('YYYY-MM-DD')
            : undefined;
          const endDate = dateRange.value?.[1]
            ? dateRange.value[1].format('YYYY-MM-DD')
            : undefined;

          const res = await getDailyStatsApi({
            endDate,
            entityType: filters.entityType || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            startDate,
          });
          statList.value = res.items || [];
          return res;
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}

function onFilterChange() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 汇总 KPI 指标卡片 -->
      <Row :gutter="12" class="shrink-0">
        <Col :span="6">
          <Card variant="borderless" class="shadow-sm" :body-style="{ padding: '16px' }">
            <Statistic
              title="当前区间总浏览量 (PV)"
              :value="totalPv"
              :value-style="{ color: '#1677ff', fontWeight: 600 }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card variant="borderless" class="shadow-sm" :body-style="{ padding: '16px' }">
            <Statistic
              title="当前区间独立访客 (UV)"
              :value="totalUv"
              :value-style="{ color: '#52c41a', fontWeight: 600 }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card variant="borderless" class="shadow-sm" :body-style="{ padding: '16px' }">
            <Statistic
              title="当前区间点赞互动"
              :value="totalLikes"
              :value-style="{ color: '#fa8c16', fontWeight: 600 }"
            />
          </Card>
        </Col>
        <Col :span="6">
          <Card variant="borderless" class="shadow-sm" :body-style="{ padding: '16px' }">
            <Statistic
              title="当前区间评论互动"
              :value="totalComments"
              :value-style="{ color: '#722ed1', fontWeight: 600 }"
            />
          </Card>
        </Col>
      </Row>

      <!-- 搜索过滤栏 -->
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <DatePicker.RangePicker
              v-model:value="dateRange"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.entityType"
              placeholder="实体类型"
              class="w-[140px]"
              allow-clear
              :options="[
                { label: '文章 (Article)', value: 'Article' },
                { label: '全部实体', value: undefined },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 数据表格 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>
  </Page>
</template>
