<script lang="ts" setup>
import type { FormattedAppItem } from '../utils/app-storage';

import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Input as AInput,
  Modal as AModal,
  Select as ASelect,
  Tooltip as ATooltip,
  message,
} from 'antdv-next';

import {
  addCustomApp,
  generateAppAlias,
  getStoredAppId,
  loadApplicationsWithAliases,
  onAppChange,
  removeAppAlias,
  setAppAlias,
  setStoredAppId,
} from '../utils/app-storage';
import { EditIcon, GridIcon, HomeIcon, PlusIcon } from '../utils/icons';

interface Props {
  modelValue?: string;
  size?: 'large' | 'middle' | 'small';
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: undefined,
  size: 'small',
});

const emit = defineEmits<{
  (e: 'update:modelValue', appId: string | undefined): void;
  (e: 'change', appId: string): void;
}>();

const route = useRoute();
const router = useRouter();

const applications = ref<FormattedAppItem[]>([]);
const loading = ref(false);
const currentAppId = ref<string | undefined>(props.modelValue);

// 别名编辑弹窗状态
const editModalVisible = ref(false);
const editingAppId = ref('');
const editingAlias = ref('');

// 新增应用弹窗状态
const addModalVisible = ref(false);
const newAppId = ref('');
const newAppAlias = ref('');

const selectOptions = computed(() => {
  return applications.value.map((app) => ({
    label: `${app.name} (${app.appId})`,
    value: app.appId,
  }));
});

async function refreshApps() {
  loading.value = true;
  try {
    applications.value = await loadApplicationsWithAliases();
    // 如果当前选中的 App 不在列表中，且列表有项，默认选中第一项
    if (!currentAppId.value && applications.value.length > 0) {
      const stored = getStoredAppId();
      const matched = applications.value.find((a) => a.appId === stored);
      const nextId = matched?.appId || applications.value[0]?.appId;
      if (nextId) {
        handleSelectApp(nextId);
      }
    }
  } finally {
    loading.value = false;
  }
}

function handleSelectApp(appId: string) {
  if (!appId || appId === currentAppId.value) return;

  currentAppId.value = appId;
  setStoredAppId(appId);
  emit('update:modelValue', appId);
  emit('change', appId);

  // 同步路由参数
  if (route.query.appId !== appId) {
    router.replace({
      query: {
        ...route.query,
        appId,
      },
    });
  }
}

// 打开别名编辑
function openEditAlias(appId?: string) {
  const targetId = appId || currentAppId.value;
  if (!targetId) return;

  const app = applications.value.find((a) => a.appId === targetId);
  editingAppId.value = targetId;
  editingAlias.value = app?.customAlias || app?.name || '';
  editModalVisible.value = true;
}

// 保存别名
async function handleSaveAlias() {
  if (!editingAppId.value) return;
  const alias = editingAlias.value.trim();
  if (alias) {
    setAppAlias(editingAppId.value, alias);
    message.success(`已为 ${editingAppId.value} 设置别名: ${alias}`);
  } else {
    removeAppAlias(editingAppId.value);
    message.success(
      `已恢复 ${editingAppId.value} 自动别名: ${generateAppAlias(editingAppId.value)}`,
    );
  }
  editModalVisible.value = false;
  await refreshApps();
}

// 恢复自动别名
function handleResetToAuto() {
  editingAlias.value = generateAppAlias(editingAppId.value);
}

// 打开新增应用弹窗
function openAddApp() {
  newAppId.value = '';
  newAppAlias.value = '';
  addModalVisible.value = true;
}

// 保存新增应用
async function handleSaveAddApp() {
  const id = newAppId.value.trim();
  if (!id) {
    message.warning('请输入有效 AppId');
    return;
  }
  addCustomApp(id, newAppAlias.value.trim() || undefined);
  message.success(`已添加应用: ${id}`);
  addModalVisible.value = false;
  await refreshApps();
  handleSelectApp(id);
}

// 跳转到统计首页
function jumpToHome() {
  router.push('/app-statistic/apps');
}

let cleanupListener: (() => void) | null = null;

onMounted(async () => {
  // 优先级：route.query.appId > props.modelValue > getStoredAppId()
  const qAppId =
    typeof route.query.appId === 'string' && route.query.appId !== 'default'
      ? route.query.appId
      : undefined;

  currentAppId.value = qAppId || props.modelValue || getStoredAppId();

  await refreshApps();

  if (currentAppId.value) {
    setStoredAppId(currentAppId.value);
  }

  // 监听跨组件 App 切换
  cleanupListener = onAppChange((appId) => {
    if (appId && appId !== currentAppId.value) {
      currentAppId.value = appId;
      emit('update:modelValue', appId);
    }
  });
});

onUnmounted(() => {
  if (cleanupListener) cleanupListener();
});

watch(
  () => props.modelValue,
  (val) => {
    if (val && val !== currentAppId.value) {
      currentAppId.value = val;
    }
  },
);

watch(
  () => route.query.appId,
  (val) => {
    if (
      typeof val === 'string' &&
      val !== 'default' &&
      val !== currentAppId.value
    ) {
      currentAppId.value = val;
      setStoredAppId(val);
      emit('update:modelValue', val);
      emit('change', val);
    }
  },
);
</script>

<template>
  <div
    class="inline-flex items-center gap-1.5 bg-card/90 border border-border/80 px-2.5 py-1 rounded-md shadow-xs"
  >
    <!-- 图标与提示 -->
    <div
      class="flex items-center gap-1 text-muted-foreground text-xs shrink-0 select-none"
    >
      <GridIcon class="text-primary text-sm size-3.5" />
      <span class="font-medium text-foreground hidden sm:inline">当前应用:</span>
    </div>

    <!-- App 选择器 -->
    <ASelect
      v-model:value="currentAppId"
      :size="size"
      :loading="loading"
      :options="selectOptions"
      show-search
      option-filter-prop="label"
      placeholder="选择或搜索 App..."
      class="min-w-[180px] max-w-[280px]"
      @change="(val: any) => handleSelectApp(val)"
    />

    <!-- 别名快捷修改按钮 -->
    <ATooltip title="修改当前应用别名">
      <AButton
        :size="size"
        type="text"
        class="text-muted-foreground hover:text-primary !px-1.5"
        @click="openEditAlias()"
      >
        <EditIcon class="size-3.5" />
      </AButton>
    </ATooltip>

    <!-- 快捷添加应用按钮 -->
    <ATooltip title="手动添加新应用">
      <AButton
        :size="size"
        type="text"
        class="text-muted-foreground hover:text-primary !px-1.5"
        @click="openAddApp"
      >
        <PlusIcon class="size-3.5" />
      </AButton>
    </ATooltip>

    <!-- 统计首页入口按钮 -->
    <ATooltip title="返回应用统计首页">
      <AButton
        :size="size"
        type="primary"
        ghost
        class="!px-2 text-xs flex items-center gap-1"
        @click="jumpToHome"
      >
        <HomeIcon class="size-3.5" />
        <span class="hidden md:inline">统计首页</span>
      </AButton>
    </ATooltip>

    <!-- 编辑别名弹窗 -->
    <AModal
      v-model:open="editModalVisible"
      title="设置应用别名 / 名称"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSaveAlias"
    >
      <div class="py-2 space-y-3">
        <div>
          <div class="text-xs text-muted-foreground mb-1">应用标识 (AppId)</div>
          <div
            class="font-mono text-sm font-semibold text-foreground bg-muted/40 p-2 rounded border border-border/50"
          >
            {{ editingAppId }}
          </div>
        </div>

        <div>
          <div
            class="flex items-center justify-between text-xs text-muted-foreground mb-1"
          >
            <span>应用别名 / 显示名称</span>
            <span
              class="text-primary cursor-pointer hover:underline"
              @click="handleResetToAuto"
            >
              填入推荐别名 ({{ generateAppAlias(editingAppId) }})
            </span>
          </div>
          <AInput
            v-model:value="editingAlias"
            placeholder="留空则自动按规范生成别名"
            allow-clear
          />
          <div class="text-[11px] text-muted-foreground mt-1">
            当前系统根据 AppId 自动生成的别名为：
            <span class="font-medium text-foreground">{{
              generateAppAlias(editingAppId)
            }}</span>
          </div>
        </div>
      </div>
    </AModal>

    <!-- 新增应用弹窗 -->
    <AModal
      v-model:open="addModalVisible"
      title="添加统计应用"
      ok-text="添加并切换"
      cancel-text="取消"
      @ok="handleSaveAddApp"
    >
      <div class="py-2 space-y-3">
        <div>
          <div class="text-xs text-muted-foreground mb-1">
            应用标识 (AppId) *
          </div>
          <AInput
            v-model:value="newAppId"
            placeholder="例如: com.rctea.im 或 gotoim-app"
            allow-clear
          />
          <div class="text-[11px] text-muted-foreground mt-1">
            作为该应用统计数据的唯一主键，建议使用规范的反向域名或唯一业务标识。
          </div>
        </div>

        <div>
          <div class="text-xs text-muted-foreground mb-1">
            应用别名 / 名称 (选填)
          </div>
          <AInput
            v-model:value="newAppAlias"
            placeholder="留空则自动根据 AppId 规范生成"
            allow-clear
          />
        </div>
      </div>
    </AModal>
  </div>
</template>
