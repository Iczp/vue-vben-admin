<script setup lang="ts">
import type {
  AppDevice,
  DeviceBinding,
  DeviceGroup,
} from '#/api/modules/app-device';

import { ref, watch } from 'vue';

import {
  Alert,
  Button,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Spin,
  Table,
  Tag,
} from 'antdv-next';

import { getAppDevice, getAppDeviceBindings } from '#/api/modules/app-device';
import { appDevicePermissions as p } from '#/api/modules/app-device/permissions';
import { useAbpStore } from '#/store/abp';

import CursorPager from '../../components/cursor-pager.vue';
import { deviceDate } from '../../context';
import { useCursorPage } from '../../use-cursor-page';

const props = defineProps<{
  appId: string;
  deviceId?: string;
  groups: DeviceGroup[];
}>();
const open = defineModel<boolean>('open', { default: false });
const abp = useAbpStore();
const record = ref<AppDevice>();
const loading = ref(false);
let generation = 0;
const bindings = useCursorPage<DeviceBinding>(async (afterId, take) => {
  if (!props.deviceId) return { items: [] };
  const items = await getAppDeviceBindings(props.appId, props.deviceId, {
    afterId,
    take,
  });
  return { items, nextId: items.length === take ? items.at(-1)?.id : null };
});
async function load() {
  const version = ++generation;
  record.value = undefined;
  bindings.clear();
  if (!open.value || !props.deviceId) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    const value = await getAppDevice(props.appId, props.deviceId);
    if (version === generation) record.value = value;
    if (version === generation && abp.hasPermission(p.bindings))
      void bindings.reset();
  } catch {
    // The request interceptor reports the error; retain the retry action in the drawer.
  } finally {
    if (version === generation) loading.value = false;
  }
}
watch([open, () => props.appId, () => props.deviceId], () => {
  void load().catch(() => {});
});
const columns = [
  { title: '用户 ID', dataIndex: 'userId' },
  {
    title: '绑定时间',
    dataIndex: 'boundAt',
    customRender: ({ text }: { text: string }) => deviceDate(text),
  },
];
</script>
<template>
  <Drawer v-model:open="open" title="设备详情" :size="760">
    <Spin :spinning="loading">
      <Descriptions v-if="record" bordered :column="1" size="small">
        <DescriptionsItem label="设备记录 ID">
          {{ record.id }}
        </DescriptionsItem>
        <DescriptionsItem label="DeviceId">
          {{ record.deviceId }}
        </DescriptionsItem>
        <DescriptionsItem label="AppId">
          {{ record.appId }}
        </DescriptionsItem>
        <DescriptionsItem label="租户">
          {{ record.tenantId || '宿主' }}
        </DescriptionsItem>
        <DescriptionsItem label="设备名称">
          {{ record.profile.name || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="平台 / 类型">
          {{ record.profile.platform || '—' }} /
          {{ record.profile.deviceType || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="品牌 / 型号">
          {{ record.profile.brand || '—' }} /
          {{ record.profile.model || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="系统 / 应用版本">
          {{ record.profile.osVersion || '—' }} /
          {{ record.profile.appVersion || '—' }}
        </DescriptionsItem>
        <DescriptionsItem label="启用状态">
          <Tag :color="record.isEnabled ? 'green' : 'red'">
            {{ record.isEnabled ? '已启用' : '已禁用' }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="所属分组">
          <span v-if="!record.groupIds.length"> — </span>
          <Tag v-for="id in record.groupIds" :key="id">
            {{ groups.find((g) => g.id === id)?.name || id }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="最近活跃">
          {{ deviceDate(record.lastSeenTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="创建时间">
          {{ deviceDate(record.creationTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="修订号">
          {{ record.revision }}
        </DescriptionsItem>
      </Descriptions>
      <Button v-else-if="!loading" @click="load"> 重新加载 </Button>
      <Alert
        class="my-4"
        type="info"
        message="最近活跃时间是延迟持久化值，不代表实时在线状态。"
      />
      <template v-if="record && abp.hasPermission(p.bindings)">
        <h3 class="mb-3 font-medium">用户绑定记录</h3>
        <Table
          row-key="id"
          :columns="columns"
          :data-source="bindings.items.value"
          :loading="bindings.loading.value"
          :pagination="false"
          size="small"
        />
        <CursorPager
          :page="bindings.page.value"
          :take="bindings.take.value"
          :count="bindings.items.value.length"
          :has-next="bindings.hasNext.value"
          :has-previous="bindings.hasPrevious.value"
          :loading="bindings.loading.value"
          @next="bindings.next"
          @previous="bindings.previous"
          @resize="
            (value) => {
              bindings.take.value = value;
              bindings.reset();
            }
          "
        />
      </template>
    </Spin>
  </Drawer>
</template>
