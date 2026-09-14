<script lang="ts" setup>
import type { DeviceGroupDto } from '#/api/device';

import { computed, onMounted, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useVirtualList } from '@vueuse/core';
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  message,
  Modal,
  Spin,
  Tooltip,
} from 'antdv-next';

import { deleteDeviceGroupApi, getDeviceGroupListApi } from '#/api/device';
import { $t } from '#/locales';

import GroupModal from './group-modal.vue';

interface Props {
  modelValue?: string;
  totalDevicesCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  totalDevicesCount: 0,
});

const emit = defineEmits<{
  (e: 'update:modelValue', val?: string): void;
  (e: 'change', val?: string): void;
  (e: 'groupChange'): void;
}>();

const PAGE_SIZE = 30;
const groupLoading = ref(false);
const groupLoadingMore = ref(false);
const groupList = ref<DeviceGroupDto[]>([]);
const totalGroups = ref(0);
const groupKeyword = ref('');

const hasMoreGroups = computed(
  () => groupList.value.length < totalGroups.value,
);

// 虚拟列表 hook: 单项高度 52px，缓冲 5 项
const {
  containerProps,
  list: virtualGroups,
  wrapperProps,
} = useVirtualList(groupList, {
  itemHeight: 52,
  overscan: 5,
});

// 设备分组弹窗
const [GroupModalComp, groupModalApi] = useVbenModal({
  connectedComponent: GroupModal,
  destroyOnClose: true,
});

// 加载第 1 页分组
async function loadGroups(isInitial = false) {
  try {
    if (isInitial) {
      groupLoading.value = true;
    }
    const res = await getDeviceGroupListApi({
      keyword: groupKeyword.value.trim() || undefined,
      maxResultCount: PAGE_SIZE,
      skipCount: 0,
    });
    groupList.value = res.items || [];
    totalGroups.value = res.totalCount || 0;
  } catch (error) {
    console.error('获取设备分组失败', error);
  } finally {
    groupLoading.value = false;
  }
}

// 分页加载下一页
async function loadMoreGroups() {
  if (groupLoading.value || groupLoadingMore.value || !hasMoreGroups.value)
    return;

  try {
    groupLoadingMore.value = true;
    const res = await getDeviceGroupListApi({
      keyword: groupKeyword.value.trim() || undefined,
      maxResultCount: PAGE_SIZE,
      skipCount: groupList.value.length,
    });
    const newItems = res.items || [];
    groupList.value = [...groupList.value, ...newItems];
    totalGroups.value = res.totalCount || groupList.value.length;
  } catch (error) {
    console.error('加载更多设备分组失败', error);
  } finally {
    groupLoadingMore.value = false;
  }
}

// 虚拟滚动容器触底检测
function onContainerScroll(e: Event) {
  const target = e.target as HTMLElement;
  if (!target) return;
  const { clientHeight, scrollHeight, scrollTop } = target;
  if (scrollHeight - scrollTop - clientHeight < 60) {
    loadMoreGroups();
  }
}

// 搜索防抖
const onSearchChange = useDebounceFn(() => {
  loadGroups();
}, 300);

watch(groupKeyword, () => {
  onSearchChange();
});

function onSelect(groupId?: string) {
  emit('update:modelValue', groupId);
  emit('change', groupId);
}

function onCreateGroup() {
  groupModalApi.setData(null).open();
}

function onEditGroup(group: DeviceGroupDto) {
  groupModalApi.setData(group).open();
}

function onDeleteGroup(group: DeviceGroupDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除设备分组【${group.name}】吗？删除后该分组下的设备将移出本分组。`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    title: '删除设备分组',
    async onOk() {
      await deleteDeviceGroupApi(group.id);
      message.success('设备分组已删除');
      if (props.modelValue === group.id) {
        onSelect(undefined);
      }
      loadGroups();
      emit('groupChange');
    },
  });
}

function onGroupSaved() {
  loadGroups();
  emit('groupChange');
}

onMounted(() => {
  loadGroups(true);
});

defineExpose({
  reload: () => loadGroups(false),
});
</script>

<template>
  <Card
    size="small"
    class="w-72 shrink-0 flex flex-col h-full shadow-sm border-border"
    :styles="{
      body: {
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      },
    }"
  >
    <GroupModalComp @success="onGroupSaved" />

    <!-- 顶部标题栏 -->
    <div class="flex items-center justify-between mb-2 shrink-0">
      <span class="font-bold text-base flex items-center gap-1.5">
        设备分组
      </span>
      <Button size="small" type="primary" @click="onCreateGroup">
        + 新建分组
      </Button>
    </div>

    <!-- 搜索输入框 -->
    <div class="mb-2 shrink-0">
      <Input.Search
        v-model:value="groupKeyword"
        placeholder="搜索分组名称..."
        size="small"
        allow-clear
        @search="() => loadGroups(true)"
      />
    </div>

    <!-- 全部设备（常驻置顶） -->
    <div
      class="shrink-0 flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors text-sm mb-1.5"
      :class="
        modelValue === undefined
          ? 'bg-primary/10 text-primary font-bold'
          : 'hover:bg-muted text-foreground'
      "
      @click="onSelect(undefined)"
    >
      <span>全部设备</span>
      <Badge
        :count="
          totalDevicesCount ||
          groupList.reduce((acc, cur) => acc + (cur.deviceCount || 0), 0)
        "
        :overflow-count="999"
        :number-style="{ backgroundColor: '#108ee9' }"
      />
    </div>

    <!-- 虚拟滚动列表容器 -->
    <div class="flex-1 overflow-hidden flex flex-col relative">
      <Spin :spinning="groupLoading" class="h-full">
        <div
          v-bind="containerProps"
          class="h-full overflow-y-auto pr-1 select-none"
          @scroll="onContainerScroll"
        >
          <div v-bind="wrapperProps">
            <div
              v-for="{ data: group } in virtualGroups"
              :key="group.id"
              class="group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition-colors text-sm h-[48px] mb-1 box-border"
              :class="
                modelValue === group.id
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'hover:bg-muted text-foreground'
              "
              @click="onSelect(group.id)"
            >
              <div class="truncate flex-1 mr-2" :title="group.name">
                <div class="truncate">{{ group.name }}</div>
                <div
                  v-if="group.description"
                  class="text-[11px] text-muted-foreground truncate"
                >
                  {{ group.description }}
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <Badge
                  :count="group.deviceCount || 0"
                  :overflow-count="999"
                  :number-style="{
                    backgroundColor:
                      modelValue === group.id ? '#1890ff' : '#8c8c8c',
                  }"
                />
                <div class="hidden group-hover:flex items-center gap-1 ml-1">
                  <Tooltip title="编辑分组">
                    <Button
                      size="small"
                      type="link"
                      class="p-0 h-auto text-xs"
                      @click.stop="onEditGroup(group)"
                    >
                      改
                    </Button>
                  </Tooltip>
                  <Tooltip title="删除分组">
                    <Button
                      size="small"
                      type="link"
                      danger
                      class="p-0 h-auto text-xs"
                      @click.stop="onDeleteGroup(group)"
                    >
                      删
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          <!-- 滚动加载指示器 -->
          <div
            v-if="groupLoadingMore"
            class="py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5"
          >
            <Spin size="small" /> 正在加载更多...
          </div>
          <div
            v-else-if="!hasMoreGroups && groupList.length > 0"
            class="py-2 text-center text-[11px] text-muted-foreground/60"
          >
            已加载全部 (共 {{ totalGroups }} 个)
          </div>

          <Empty
            v-if="!groupLoading && groupList.length === 0"
            description="暂无分组"
            class="mt-6"
          />
        </div>
      </Spin>
    </div>
  </Card>
</template>
