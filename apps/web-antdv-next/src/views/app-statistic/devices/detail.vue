<script lang="ts" setup>
import type { DeviceDetailDto } from '#/api/app-statistic/types';

import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Descriptions as ADescriptions,
  Spin as ASpin,
  Tag as ATag,
} from 'antdv-next';
import { DescriptionsItem as ADescriptionsItem } from 'antdv-next';
import dayjs from 'dayjs';

import { getDeviceDetailApi } from '#/api/app-statistic/device';
import { $t } from '#/locales';

import { DeviceDisplay, TrendChart, UserDisplay } from '../components';
import StatisticError from '../components/StatisticError.vue';
import ATable from '../components/StatisticTable.vue';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const deviceDetail = ref<DeviceDetailDto | null>(null);

async function loadDetail() {
  const id = route.params.id;
  if (typeof id !== 'string' || !id) return;
  deviceDetail.value = null;
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const res = await getDeviceDetailApi(id);
    if (currentRequest !== requestId) return;
    deviceDetail.value = res;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function goBack() {
  router.back();
}

const eventColumns = [
  {
    title: $t('appStatistic.text099'),
    dataIndex: 'eventTime',
    key: 'eventTime',
    width: 170,
    render: (text: string) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: $t('appStatistic.text100'),
    dataIndex: 'eventName',
    key: 'eventName',
    width: 150,
  },
  {
    title: $t('appStatistic.text101'),
    dataIndex: 'page',
    key: 'page',
  },
  {
    title: $t('appStatistic.text102'),
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
    title: $t('appStatistic.text103'),
    dataIndex: 'properties',
    key: 'properties',
    ellipsis: true,
  },
];

watch(() => route.params.id, loadDetail, { immediate: true });
</script>

<template>
  <div class="p-4 space-y-4">
    <StatisticError v-if="failed" @retry="loadDetail" />
    <!-- Top Action Bar -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <AButton size="small" @click="goBack">
          {{ $t('appStatistic.text104') }}
        </AButton>
        <h2 class="text-xl font-bold tracking-tight text-foreground m-0">
          {{ $t('appStatistic.text005') }}
        </h2>
      </div>
      <AButton :loading="loading" size="small" @click="loadDetail">
        {{ $t('appStatistic.text011') }}
      </AButton>
    </div>

    <ASpin :spinning="loading">
      <div v-if="deviceDetail && !failed" class="space-y-4">
        <!-- Device Info Card -->
        <ACard
          :bordered="false"
          class="shadow-sm"
          size="small"
          :title="$t('appStatistic.text105')"
        >
          <ADescriptions
            :column="{ xs: 1, sm: 2, md: 3, lg: 4 }"
            bordered
            size="small"
          >
            <ADescriptionsItem label="设备名称" :span="2">
              <DeviceDisplay :device="deviceDetail.device" :clickable="false" />
            </ADescriptionsItem>

            <ADescriptionsItem label="DeviceKey" :span="2">
              <span class="font-mono text-xs">{{
                deviceDetail.device.deviceKey
              }}</span>
            </ADescriptionsItem>

            <ADescriptionsItem label="App ID">
              {{ deviceDetail.device.appId }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text015')">
              <ATag color="blue">
                {{ deviceDetail.device.platform || '-' }}
              </ATag>
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text106')">
              {{ deviceDetail.device.manufacturer || '-' }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text087')">
              {{ deviceDetail.device.model || '-' }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text107')">
              {{ deviceDetail.device.osName }}
              {{ deviceDetail.device.osVersion }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text108')">
              {{ deviceDetail.device.appVersion || '-' }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text109')">
              {{ deviceDetail.device.channel || '-' }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text110')">
              {{ deviceDetail.device.language || '-' }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text111')">
              {{ deviceDetail.device.timeZone || '-' }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text112')" :span="2">
              <UserDisplay :userId="deviceDetail.device.lastUserId" />
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text113')">
              {{
                dayjs(deviceDetail.device.firstSeenTime).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text114')">
              {{
                dayjs(deviceDetail.device.lastSeenTime).format(
                  'YYYY-MM-DD HH:mm:ss',
                )
              }}
            </ADescriptionsItem>

            <ADescriptionsItem :label="$t('appStatistic.text115')" :span="2">
              {{
                deviceDetail.device.lastLoginTime
                  ? dayjs(deviceDetail.device.lastLoginTime).format(
                      'YYYY-MM-DD HH:mm:ss',
                    )
                  : '-'
              }}
            </ADescriptionsItem>
          </ADescriptions>
        </ACard>

        <!-- 30 Days Trend -->
        <TrendChart
          :data="deviceDetail.recent30DaysTrends"
          :metrics="[
            {
              key: 'events',
              label: $t('appStatistic.text116'),
              color: '#1677ff',
            },
          ]"
          :title="$t('appStatistic.text117')"
        />

        <ACard :title="$t('appStatistic.text177')" :bordered="false">
          <ATable
            :data-source="deviceDetail.recentSessions ?? []"
            :pagination="false"
            row-key="sessionId"
            size="small"
            :columns="[
              { title: 'Session ID', dataIndex: 'sessionId' },
              { title: '用户 (名称 / ID)', dataIndex: 'userId', key: 'userId' },
              {
                title: $t('appStatistic.text131'),
                dataIndex: 'startTime',
                render: (text: string) =>
                  dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
              },
              {
                title: $t('appStatistic.text050'),
                dataIndex: 'durationSeconds',
              },
            ]"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'userId'">
                <UserDisplay :userId="record.userId" />
              </template>
            </template>
          </ATable>
        </ACard>
        <!-- Recent Events -->
        <ACard
          :bordered="false"
          class="shadow-sm"
          size="small"
          :title="$t('appStatistic.text118')"
        >
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
