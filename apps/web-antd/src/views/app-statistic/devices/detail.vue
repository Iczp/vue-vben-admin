<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Descriptions as ADescriptions,
  Spin as ASpin,
  Table as ATable,
  Tag as ATag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDeviceDetailApi } from '#/api/app-statistic/device';
import type { DeviceDetailDto } from '#/api/app-statistic/types';

import { TrendChart } from '../components';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const deviceDetail = ref<DeviceDetailDto | null>(null);

const id = String(route.params.id);

async function loadDetail() {
  if (!id) return;
  loading.value = true;
  try {
    const res = await getDeviceDetailApi(id);
    deviceDetail.value = res;
  } catch (error) {
    console.error('Failed to load device detail', error);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.back();
}

const eventColumns = [
  {
    title: '事件时间',
    dataIndex: 'eventTime',
    key: 'eventTime',
    width: 170,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '事件名称',
    dataIndex: 'eventName',
    key: 'eventName',
    width: 150,
  },
  {
    title: '页面',
    dataIndex: 'page',
    key: 'page',
  },
  {
    title: '应用版本',
    dataIndex: 'appVersion',
    key: 'appVersion',
    width: 100,
  },
  {
    title: 'Session ID',
    dataIndex: 'sessionId',
    key: 'sessionId',
    ellipsis: true,
  },
  {
    title: '附加属性 (Properties)',
    dataIndex: 'properties',
    key: 'properties',
    ellipsis: true,
  },
];

onMounted(() => {
  loadDetail();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <AButton size="small" @click="goBack">← 返回设备列表</AButton>
        <h2 class="text-xl font-bold tracking-tight text-foreground m-0">
          设备统计详情
        </h2>
      </div>
      <AButton :loading="loading" size="small" @click="loadDetail">刷新</AButton>
    </div>

    <ASpin :spinning="loading">
      <div v-if="deviceDetail" class="space-y-4">
        <!-- Device Info Card -->
        <ACard :bordered="false" class="shadow-sm" size="small" title="设备基本信息">
          <ADescriptions :column="{ xs: 1, sm: 2, md: 3, lg: 4 }" bordered size="small">
            <ADescriptions.Item label="DeviceKey" :span="2">
              <span class="font-mono text-xs">{{ deviceDetail.device.deviceKey }}</span>
            </ADescriptions.Item>

            <ADescriptions.Item label="App ID">
              {{ deviceDetail.device.appId }}
            </ADescriptions.Item>

            <ADescriptions.Item label="平台">
              <ATag color="blue">{{ deviceDetail.device.platform || '-' }}</ATag>
            </ADescriptions.Item>

            <ADescriptions.Item label="设备品牌">
              {{ deviceDetail.device.manufacturer || '-' }}
            </ADescriptions.Item>

            <ADescriptions.Item label="设备型号">
              {{ deviceDetail.device.model || '-' }}
            </ADescriptions.Item>

            <ADescriptions.Item label="操作系统">
              {{ deviceDetail.device.osName }} {{ deviceDetail.device.osVersion }}
            </ADescriptions.Item>

            <ADescriptions.Item label="当前 App 版本">
              {{ deviceDetail.device.appVersion || '-' }}
            </ADescriptions.Item>

            <ADescriptions.Item label="分发渠道">
              {{ deviceDetail.device.channel || '-' }}
            </ADescriptions.Item>

            <ADescriptions.Item label="系统语言">
              {{ deviceDetail.device.language || '-' }}
            </ADescriptions.Item>

            <ADescriptions.Item label="时区">
              {{ deviceDetail.device.timeZone || '-' }}
            </ADescriptions.Item>

            <ADescriptions.Item label="最近登录用户">
              <span class="font-mono text-xs">{{ deviceDetail.device.lastUserId || '-' }}</span>
            </ADescriptions.Item>

            <ADescriptions.Item label="首次活跃时间">
              {{ dayjs(deviceDetail.device.firstSeenTime).format('YYYY-MM-DD HH:mm:ss') }}
            </ADescriptions.Item>

            <ADescriptions.Item label="最近活跃时间">
              {{ dayjs(deviceDetail.device.lastSeenTime).format('YYYY-MM-DD HH:mm:ss') }}
            </ADescriptions.Item>

            <ADescriptions.Item label="最近登录时间" :span="2">
              {{
                deviceDetail.device.lastLoginTime
                  ? dayjs(deviceDetail.device.lastLoginTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'
              }}
            </ADescriptions.Item>
          </ADescriptions>
        </ACard>

        <!-- 30 Days Trend -->
        <TrendChart
          :data="deviceDetail.recent30DaysTrends"
          :metrics="[
            { key: 'launch_count', label: '启动次数', color: '#1677ff' },
            { key: 'page_view_count', label: '浏览量 (PV)', color: '#52c41a' },
            { key: 'duration_seconds', label: '使用时长(秒)', color: '#722ed1' },
          ]"
          title="近 30 天活跃度趋势"
        />

        <!-- Recent Events -->
        <ACard :bordered="false" class="shadow-sm" size="small" title="该设备最近上报事件">
          <ATable
            :columns="eventColumns"
            :data-source="deviceDetail.recentEvents"
            :pagination="false"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.dataIndex === 'eventName'">
                <ATag color="geekblue">{{ record.eventName }}</ATag>
              </template>
            </template>
          </ATable>
        </ACard>
      </div>
    </ASpin>
  </div>
</template>
