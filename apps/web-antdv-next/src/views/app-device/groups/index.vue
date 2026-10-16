<script setup lang="ts">
import type { DeviceGroup } from '#/api/modules/app-device';

import { computed, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { Alert, Button, Card, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAppDeviceGroup,
  getAppDeviceGroups,
} from '#/api/modules/app-device';
import { appDevicePermissions as p } from '#/api/modules/app-device/permissions';
import { useAbpStore } from '#/store/abp';

import AppScope from '../components/app-scope.vue';
import CursorPager from '../components/cursor-pager.vue';
import { isDeviceConflict, useAppDeviceApp } from '../context';
import { useCursorPage } from '../use-cursor-page';
import GroupForm from './modules/form-modal.vue';
import MembersDrawer from './modules/members-drawer.vue';

const abp = useAbpStore();
const appId = useAppDeviceApp();
const scopeKey = computed(
  () =>
    `${appId.value}:${abp.currentTenant?.id ?? ''}:${abp.currentUser?.id ?? ''}`,
);
const current = ref<DeviceGroup>();
const editing = ref(false);
const members = ref(false);
const mutating = ref(false);
const page = useCursorPage<DeviceGroup>((afterId, take) =>
  appId.value && abp.hasPermission(p.groups)
    ? getAppDeviceGroups(appId.value, { afterId, take })
    : Promise.resolve({ items: [] }),
);
const [Grid, grid] = useVbenVxeGrid<DeviceGroup>({
  gridOptions: {
    data: [],
    height: 'auto',
    rowConfig: { keyField: 'id' },
    pagerConfig: { enabled: false },
    proxyConfig: { enabled: false },
    columns: [
      { field: 'name', title: '分组名称', minWidth: 180 },
      { field: 'description', title: '说明', minWidth: 300 },
      { field: 'appId', title: '应用', width: 150 },
      {
        title: '操作',
        width: 230,
        fixed: 'right',
        slots: { default: 'actions' },
      },
    ],
  },
});
watch(page.items, (data) => grid.setGridOptions({ data }));
watch(page.loading, (value) => grid.setLoading(value));
watch(
  [scopeKey, () => abp.hasPermission(p.groups)],
  () => {
    editing.value = false;
    members.value = false;
    current.value = undefined;
    void page.reset();
  },
  { immediate: true },
);
function edit(row?: DeviceGroup) {
  current.value = row;
  editing.value = true;
}
function showMembers(row: DeviceGroup) {
  current.value = row;
  members.value = true;
}
function remove(row: DeviceGroup) {
  Modal.confirm({
    title: '删除分组',
    content: `确定删除分组「${row.name}」吗？设备记录会保留，删除后的分组名称仍被占用。`,
    okType: 'danger',
    async onOk() {
      mutating.value = true;
      try {
        await deleteAppDeviceGroup(row.id, {
          appId: row.appId,
          name: row.name,
          description: row.description ?? '',
          concurrencyStamp: row.concurrencyStamp,
        });
        message.success('分组已删除');
        await page.load();
      } catch (error) {
        if (isDeviceConflict(error)) {
          message.warning('分组已被其他操作修改，请刷新后重试');
          await page.load();
        } else throw error;
      } finally {
        mutating.value = false;
      }
    },
  });
}
</script>
<template>
  <Page auto-content-height>
    <div class="flex h-full flex-col gap-3">
      <Card variant="borderless" :styles="{ body: { padding: '12px 16px' } }">
        <div class="flex flex-wrap items-center gap-3">
          <AppScope v-model="appId" />
          <Button
            :disabled="!appId"
            :loading="page.loading.value"
            @click="page.load()"
          >
            刷新
          </Button>
          <Button
            v-if="abp.hasPermission(p.manageGroups)"
            type="primary"
            :disabled="!appId || mutating"
            @click="edit()"
          >
            新建分组
          </Button>
        </div>
      </Card>
      <Alert
        v-if="page.failed.value"
        type="error"
        message="分组查询失败，请刷新重试。"
      />
      <Alert
        v-if="!abp.hasPermission(p.groups)"
        type="warning"
        message="没有分组查看权限。"
      />
      <div class="min-h-0 flex-1 rounded-lg bg-background p-2">
        <Grid>
          <template #actions="{ row }">
            <div class="flex justify-center gap-2">
              <Button
                v-if="abp.hasPermission(p.read)"
                type="link"
                size="small"
                @click="showMembers(row)"
              >
                成员
              </Button>
              <Button
                v-if="abp.hasPermission(p.manageGroups)"
                type="link"
                size="small"
                :disabled="mutating"
                @click="edit(row)"
              >
                编辑
              </Button>
              <Button
                v-if="abp.hasPermission(p.manageGroups)"
                type="link"
                danger
                size="small"
                :disabled="mutating"
                @click="remove(row)"
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
    <GroupForm
      v-model:open="editing"
      :app-id="appId"
      :record="current"
      @success="page.load()"
    />
    <MembersDrawer
      :key="scopeKey"
      v-model:open="members"
      :app-id="appId"
      :group="current"
      @changed="page.load()"
    />
  </Page>
</template>
