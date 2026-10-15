<script setup lang="ts">
import type { AppDevice, DeviceGroup } from '#/api/modules/app-device';

import { computed, reactive, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAppDevices, setAppDeviceState } from '#/api/modules/app-device';
import { appDevicePermissions as p } from '#/api/modules/app-device/permissions';
import { useAbpStore } from '#/store/abp';

import AppScope from '../components/app-scope.vue';
import CursorPager from '../components/cursor-pager.vue';
import GroupSelect from '../components/group-select.vue';
import MemberAction from '../components/member-action.vue';
import { isDeviceConflict, useAppDeviceApp } from '../context';
import { useCursorPage } from '../use-cursor-page';
import { deviceColumns } from './data';
import DetailDrawer from './modules/detail-drawer.vue';
import EditModal from './modules/edit-modal.vue';

const abp = useAbpStore();
const appId = useAppDeviceApp();
const scopeKey = computed(
  () =>
    `${appId.value}:${abp.currentTenant?.id ?? ''}:${abp.currentUser?.id ?? ''}`,
);
const filters = reactive({
  keyword: '',
  platform: undefined as string | undefined,
  enabled: undefined as number | undefined,
  userId: '',
  groupId: undefined as string | undefined,
});
const applied = ref({ ...filters });
const groups = ref<DeviceGroup[]>([]);
const editing = ref(false);
const detail = ref(false);
const currentId = ref<string>();
const assignOpen = ref(false);
const assignGroup = ref<string>();
const assignDevice = ref<AppDevice>();
const addToGroup = ref(1);
const memberAction = ref<InstanceType<typeof MemberAction>>();
const memberBusy = ref(false);
const mutating = ref(false);
const page = useCursorPage<AppDevice>((afterId, take) => {
  if (!appId.value || !abp.hasPermission(p.read))
    return Promise.resolve({ items: [] });
  const values = applied.value;
  return getAppDevices({
    appId: appId.value,
    afterId,
    take,
    keyword: values.keyword.trim() || undefined,
    platform: values.platform,
    enabled: values.enabled === undefined ? undefined : values.enabled === 1,
    userId: values.userId.trim() || undefined,
    groupId: values.groupId,
  });
});
const [Grid, grid] = useVbenVxeGrid<AppDevice>({
  gridOptions: {
    columns: deviceColumns,
    height: 'auto',
    rowConfig: { keyField: 'id' },
    pagerConfig: { enabled: false },
    proxyConfig: { enabled: false },
    toolbarConfig: { enabled: false },
    data: [],
  },
});
watch(page.items, (data) => grid.setGridOptions({ data }));
watch(page.loading, (value) => grid.setLoading(value));
function search() {
  if (
    filters.userId.trim() &&
    !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(filters.userId.trim())
  ) {
    message.warning('用户 ID 必须是有效的 GUID');
    return;
  }
  applied.value = { ...filters };
  void page.reset();
}
watch(
  [scopeKey, () => abp.hasPermission(p.read)],
  () => {
    filters.groupId = undefined;
    groups.value = [];
    editing.value = false;
    detail.value = false;
    assignOpen.value = false;
    applied.value = { ...filters };
    void page.reset();
  },
  { immediate: true },
);
function showDetail(row: AppDevice) {
  currentId.value = row.id;
  detail.value = true;
}
function edit(row: AppDevice) {
  currentId.value = row.id;
  editing.value = true;
}
function state(row: AppDevice, operation: 'delete' | 'disable' | 'enable') {
  const label = { enable: '启用', disable: '禁用', delete: '删除' }[operation];
  Modal.confirm({
    title: `${label}设备`,
    content: `确定${label}设备「${row.profile.name || row.deviceId}」吗？${operation === 'delete' ? '删除后将不再显示在当前列表。' : ''}`,
    okType: operation === 'delete' ? 'danger' : 'primary',
    async onOk() {
      mutating.value = true;
      try {
        await setAppDeviceState(row.id, operation, {
          appId: appId.value,
          concurrencyStamp: row.concurrencyStamp,
        });
        message.success(`设备已${label}`);
        await page.load();
      } catch (error) {
        if (isDeviceConflict(error)) {
          message.warning('设备已被其他操作修改，请刷新后重试');
          await page.load();
        } else throw error;
      } finally {
        mutating.value = false;
      }
    },
  });
}
function assign(row: AppDevice) {
  assignDevice.value = row;
  assignGroup.value = undefined;
  addToGroup.value = 1;
  assignOpen.value = true;
}
function confirmAssign() {
  const group = groups.value.find((g) => g.id === assignGroup.value);
  if (!group || !assignDevice.value) {
    message.warning('请选择分组');
    return;
  }
  assignOpen.value = false;
  memberAction.value?.start(
    group,
    [assignDevice.value.id],
    addToGroup.value === 1,
  );
}
</script>
<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <Card variant="borderless" :styles="{ body: { padding: '12px 16px' } }">
        <div class="flex flex-wrap items-center gap-3">
          <AppScope v-model="appId" />
          <Input
            v-model:value="filters.keyword"
            aria-label="设备关键词"
            placeholder="设备名称 / DeviceId"
            class="w-56"
            :maxlength="128"
            allow-clear
            @press-enter="search"
          />
          <Select
            v-model:value="filters.platform"
            placeholder="平台"
            class="w-32"
            allow-clear
            :options="
              ['android', 'ios', 'windows', 'macos', 'web'].map((value) => ({
                label: value,
                value,
              }))
            "
          />
          <Select
            v-model:value="filters.enabled"
            placeholder="启用状态"
            class="w-32"
            allow-clear
            :options="[
              { label: '启用', value: 1 },
              { label: '禁用', value: 0 },
            ]"
          />
          <Input
            v-model:value="filters.userId"
            aria-label="用户 ID"
            placeholder="用户 ID（GUID）"
            class="w-64"
            allow-clear
            @press-enter="search"
          />
          <GroupSelect
            v-if="abp.hasPermission(p.groups)"
            :key="scopeKey"
            v-model="filters.groupId"
            :app-id="appId"
            @loaded="groups = $event"
          />
          <Button
            type="primary"
            :disabled="!appId"
            :loading="page.loading.value"
            @click="search"
          >
            查询
          </Button>
          <Button :disabled="!appId" @click="page.load()"> 刷新 </Button>
          <MemberAction
            :key="scopeKey"
            ref="memberAction"
            :app-id="appId"
            @busy="memberBusy = $event"
            @success="page.load()"
          />
        </div>
      </Card>
      <Alert
        v-if="abp.appDeviceConfigurationError"
        type="warning"
        message="设备服务权限加载失败，请检查服务连接后重新登录。"
      />
      <Alert
        v-else-if="!abp.hasPermission(p.read)"
        type="warning"
        message="没有设备查看权限。"
      />
      <Alert
        v-if="page.failed.value"
        type="error"
        message="设备查询失败，请刷新重试。"
      />
      <div class="min-h-0 flex-1 rounded-lg bg-background p-2">
        <Grid>
          <template #enabled="{ row }">
            <Tag :color="row.isEnabled ? 'green' : 'red'">
              {{ row.isEnabled ? '已启用' : '已禁用' }}
            </Tag>
          </template>
          <template #groups="{ row }">
            <Tag v-for="id in row.groupIds" :key="id">
              {{ groups.find((g) => g.id === id)?.name || id }}
            </Tag>
          </template>
          <template #actions="{ row }">
            <div class="flex flex-wrap justify-center gap-1">
              <Button size="small" type="link" @click="showDetail(row)">
                详情
              </Button>
              <Button
                v-if="abp.hasPermission(p.update)"
                size="small"
                type="link"
                :disabled="mutating"
                @click="edit(row)"
              >
                编辑
              </Button>
              <Button
                v-if="
                  abp.hasPermission(p.groups) && abp.hasPermission(p.members)
                "
                size="small"
                type="link"
                :disabled="memberBusy"
                @click="assign(row)"
              >
                分组
              </Button>
              <Button
                v-if="
                  row.isEnabled
                    ? abp.hasPermission(p.disable)
                    : abp.hasPermission(p.enable)
                "
                size="small"
                type="link"
                :disabled="mutating"
                @click="state(row, row.isEnabled ? 'disable' : 'enable')"
              >
                {{ row.isEnabled ? '禁用' : '启用' }}
              </Button>
              <Button
                v-if="abp.hasPermission(p.delete)"
                size="small"
                type="link"
                danger
                :disabled="mutating"
                @click="state(row, 'delete')"
              >
                删除
              </Button>
            </div>
          </template>
        </Grid>
      </div>
      <CursorPager
        :page="page.page.value"
        :take="page.take.value"
        :count="page.items.value.length"
        :has-next="page.hasNext.value"
        :has-previous="page.hasPrevious.value"
        :loading="page.loading.value"
        @next="page.next"
        @previous="page.previous"
        @resize="
          (value) => {
            page.take.value = value;
            page.reset();
          }
        "
      />
    </div>
    <EditModal
      v-model:open="editing"
      :app-id="appId"
      :device-id="currentId"
      @success="page.load()"
    />
    <DetailDrawer
      v-model:open="detail"
      :app-id="appId"
      :device-id="currentId"
      :groups="groups"
    />
    <Modal v-model:open="assignOpen" title="调整设备分组" @ok="confirmAssign">
      <div class="flex flex-col gap-4">
        <GroupSelect
          v-model="assignGroup"
          :app-id="appId"
          @loaded="groups = $event"
        />
        <Select
          v-model:value="addToGroup"
          :options="[
            { label: '加入该分组', value: 1 },
            { label: '移出该分组', value: 0 },
          ]"
        />
      </div>
    </Modal>
  </Page>
</template>
