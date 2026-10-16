<script setup lang="ts">
import type { AppDevice, DeviceGroup } from '#/api/modules/app-device';

import { ref, watch } from 'vue';

import { Alert, Button, Drawer, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAppDeviceGroupMembers } from '#/api/modules/app-device';
import { appDevicePermissions as p } from '#/api/modules/app-device/permissions';
import { useAbpStore } from '#/store/abp';

import CursorPager from '../../components/cursor-pager.vue';
import DevicePicker from '../../components/device-picker.vue';
import MemberAction from '../../components/member-action.vue';
import { useCursorPage } from '../../use-cursor-page';
const props = defineProps<{ appId: string; group?: DeviceGroup }>();
const emit = defineEmits<{ changed: [] }>();
const open = defineModel<boolean>('open', { default: false });
const abp = useAbpStore();
const picker = ref(false);
const action = ref<InstanceType<typeof MemberAction>>();
const busy = ref(false);
const selection = ref<string[]>([]);
const page = useCursorPage<AppDevice>((afterId, take) =>
  props.group
    ? getAppDeviceGroupMembers(props.appId, props.group.id, { afterId, take })
    : Promise.resolve({ items: [] }),
);
const [Grid, grid] = useVbenVxeGrid<AppDevice>({
  gridOptions: {
    data: [],
    height: 400,
    pagerConfig: { enabled: false },
    proxyConfig: { enabled: false },
    rowConfig: { keyField: 'id' },
    columns: [
      { type: 'checkbox', width: 45, visible: abp.hasPermission(p.members) },
      { field: 'profile.name', title: '设备名称', minWidth: 150 },
      { field: 'deviceId', title: 'DeviceId', minWidth: 220 },
      { field: 'profile.platform', title: '平台', width: 100 },
      { title: '操作', width: 90, slots: { default: 'actions' } },
    ],
  },
  gridEvents: {
    checkboxChange: () => {
      selection.value = grid.grid
        .getCheckboxRecords()
        .map((r: AppDevice) => r.id);
    },
    checkboxAll: () => {
      selection.value = grid.grid
        .getCheckboxRecords()
        .map((r: AppDevice) => r.id);
    },
  },
});
watch(page.items, (data) => {
  selection.value = [];
  grid.setGridOptions({ data });
});
watch(page.loading, (value) => grid.setLoading(value));
watch([open, () => props.appId, () => props.group?.id], () => {
  picker.value = false;
  selection.value = [];
  if (open.value && props.group && abp.hasPermission(p.read)) void page.reset();
  else page.clear();
});
async function membersChanged() {
  await page.load();
  emit('changed');
}
function remove(ids: string[]) {
  if (!props.group || ids.length === 0) return;
  action.value?.start(props.group, ids, false);
}
function add(devices: AppDevice[]) {
  if (!props.group) return;
  action.value?.start(
    props.group,
    devices.map((d) => d.id),
    true,
  );
}
function addPicker() {
  if (!abp.hasPermission(p.read)) {
    message.warning('没有设备查询权限');
    return;
  }
  picker.value = true;
}
</script>
<template>
  <Drawer
    v-model:open="open"
    :title="`分组成员 · ${group?.name || ''}`"
    :size="1000"
    :destroy-on-close="false"
  >
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap gap-2">
        <Button
          v-if="abp.hasPermission(p.members)"
          type="primary"
          :disabled="busy"
          @click="addPicker"
        >
          添加设备
        </Button>
        <Button
          v-if="abp.hasPermission(p.members)"
          danger
          :disabled="busy || !selection.length"
          @click="remove(selection)"
        >
          移除已选（{{ selection.length }}）
        </Button>
        <Button @click="page.load()"> 刷新 </Button>
      </div>
      <Alert
        v-if="page.failed.value"
        type="error"
        message="成员查询失败，请刷新重试。"
      />
      <Grid>
        <template #actions="{ row }">
          <Button
            v-if="abp.hasPermission(p.members)"
            type="link"
            danger
            size="small"
            :disabled="busy"
            @click="remove([row.id])"
          >
            移除
          </Button>
        </template>
      </Grid>
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
  </Drawer>
  <DevicePicker
    v-model:open="picker"
    :app-id="appId"
    :max="1000"
    @confirm="add"
  />
  <MemberAction
    ref="action"
    :key="`${appId}:${group?.id}`"
    :app-id="appId"
    @busy="busy = $event"
    @success="membersChanged"
  />
</template>
