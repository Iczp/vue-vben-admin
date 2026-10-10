<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Empty as AEmpty,
  Input as AInput,
  message,
  Modal as AModal,
  RadioButton as ARadioButton,
  RadioGroup as ARadioGroup,
  Row as ARow,
  Spin as ASpin,
  Tag as ATag,
  Tooltip as ATooltip,
} from 'antdv-next';

import { getOverviewApi } from '#/api/app-statistic/dashboard';
import type { OverviewDto } from '#/api/app-statistic/types';

import type { FormattedAppItem } from '../utils/app-storage';
import {
  addCustomApp,
  generateAppAlias,
  loadApplicationsWithAliases,
  removeAppAlias,
  setAppAlias,
  setStoredAppId,
} from '../utils/app-storage';
import {
  ChartIcon,
  CopyIcon,
  EditIcon,
  GridIcon,
  ListIcon,
  PlusIcon,
  ReloadIcon,
  SearchIcon,
} from '../utils/icons';

const router = useRouter();

const loading = ref(false);
const applications = ref<FormattedAppItem[]>([]);
const searchKeyword = ref('');
const viewMode = ref<'grid' | 'table'>('grid');

// 概览指标缓存：Map<AppId, OverviewDto>
const overviewMap = ref<Record<string, OverviewDto | null>>({});
const overviewLoading = ref<Record<string, boolean>>({});

// 弹窗状态
const editModalVisible = ref(false);
const editingAppId = ref('');
const editingAlias = ref('');

const addModalVisible = ref(false);
const newAppId = ref('');
const newAppAlias = ref('');

// 过滤应用列表
const filteredApps = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return applications.value;
  return applications.value.filter(
    (app) =>
      app.appId.toLowerCase().includes(kw) ||
      app.name.toLowerCase().includes(kw) ||
      app.autoAlias.toLowerCase().includes(kw),
  );
});

// 汇总数据
const totalDau = computed(() => {
  return Object.values(overviewMap.value).reduce((sum, item) => sum + (item?.todayDau || 0), 0);
});

const totalNewUsers = computed(() => {
  return Object.values(overviewMap.value).reduce((sum, item) => sum + (item?.todayNewUsers || 0), 0);
});

const totalActiveDevices = computed(() => {
  return Object.values(overviewMap.value).reduce((sum, item) => sum + (item?.todayActiveDevices || 0), 0);
});

// 加载单个 App 的今日指标
async function loadAppOverview(appId: string) {
  if (overviewLoading.value[appId]) return;
  overviewLoading.value[appId] = true;
  try {
    const res = await getOverviewApi(appId);
    overviewMap.value[appId] = res;
  } catch {
    overviewMap.value[appId] = null;
  } finally {
    overviewLoading.value[appId] = false;
  }
}

// 刷新全部应用与概览
async function loadData() {
  loading.value = true;
  try {
    applications.value = await loadApplicationsWithAliases();
    // 并行获取各应用的今日数据概览
    applications.value.forEach((app) => {
      loadAppOverview(app.appId);
    });
  } catch {
    message.error('加载应用列表失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadData();
});

// 选择某个 App 并跳转到多维分析页面
function viewAnalysis(appId: string, targetPath = '/app-statistic/overview') {
  setStoredAppId(appId);
  router.push({
    path: targetPath,
    query: { appId },
  });
}

// 复制 AppId
async function copyAppId(appId: string) {
  try {
    await navigator.clipboard.writeText(appId);
    message.success(`已复制 AppId: ${appId}`);
  } catch {
    message.error('复制失败');
  }
}

// 打开别名编辑
function openEditAlias(app: FormattedAppItem) {
  editingAppId.value = app.appId;
  editingAlias.value = app.customAlias || app.name;
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
    message.success(`已恢复 ${editingAppId.value} 为自动生成别名`);
  }
  editModalVisible.value = false;
  await loadData();
}

// 恢复自动生成别名
function handleResetToAuto() {
  editingAlias.value = generateAppAlias(editingAppId.value);
}

// 保存新增应用
async function handleSaveAddApp() {
  const id = newAppId.value.trim();
  if (!id) {
    message.warning('请输入有效的 AppId');
    return;
  }
  addCustomApp(id, newAppAlias.value.trim() || undefined);
  message.success(`已添加应用: ${id}`);
  addModalVisible.value = false;
  await loadData();
}

// 获取应用头像渐变色
function getAppAvatarBg(name: string) {
  const gradients = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-sky-600',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

// 获取应用名称缩写
function getAppInitials(name: string) {
  if (!name) return 'AP';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    const p0 = parts[0][0] || '';
    const p1 = parts[1][0] || '';
    return (p0 + p1).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- 顶部概览 Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-card p-5 rounded-lg border border-border shadow-xs">
      <div>
        <div class="flex items-center gap-2">
          <GridIcon class="text-2xl text-primary size-6" />
          <h1 class="text-xl font-bold tracking-tight text-foreground">App 统计分析中心</h1>
          <ATag color="blue" class="ml-1 text-xs">AppId 主维度</ATag>
        </div>
        <p class="text-xs text-muted-foreground mt-1.5 max-w-2xl">
          以 AppId 为核心维度统一管理与分析所有接入的应用运行、活跃与事件数据。选择下方任意 App 即可查看数据概览并可在各分析页右上角随时切换。
        </p>
      </div>

      <div class="flex items-center gap-2">
        <AButton type="primary" class="flex items-center gap-1" @click="addModalVisible = true">
          <PlusIcon class="size-3.5" />
          <span>添加应用</span>
        </AButton>
        <AButton :loading="loading" class="flex items-center gap-1" @click="loadData">
          <ReloadIcon class="size-3.5" />
          <span>刷新</span>
        </AButton>
      </div>
    </div>

    <!-- 快捷统计卡片 -->
    <ARow :gutter="[12, 12]">
      <ACol :xs="24" :sm="12" :md="6">
        <ACard :bordered="false" class="shadow-2xs">
          <div class="text-xs text-muted-foreground">接入应用总数</div>
          <div class="text-2xl font-bold text-foreground mt-1">{{ applications.length }}</div>
          <div class="text-[11px] text-muted-foreground mt-1">包含配置与自发现应用</div>
        </ACard>
      </ACol>

      <ACol :xs="24" :sm="12" :md="6">
        <ACard :bordered="false" class="shadow-2xs">
          <div class="text-xs text-muted-foreground">今日总活跃用户 (DAU)</div>
          <div class="text-2xl font-bold text-primary mt-1">{{ totalDau.toLocaleString() }}</div>
          <div class="text-[11px] text-muted-foreground mt-1">所有应用今日去重用户</div>
        </ACard>
      </ACol>

      <ACol :xs="24" :sm="12" :md="6">
        <ACard :bordered="false" class="shadow-2xs">
          <div class="text-xs text-muted-foreground">今日总新增用户</div>
          <div class="text-2xl font-bold text-emerald-600 mt-1">{{ totalNewUsers.toLocaleString() }}</div>
          <div class="text-[11px] text-muted-foreground mt-1">首次访问并上报事实</div>
        </ACard>
      </ACol>

      <ACol :xs="24" :sm="12" :md="6">
        <ACard :bordered="false" class="shadow-2xs">
          <div class="text-xs text-muted-foreground">今日活跃设备总数</div>
          <div class="text-2xl font-bold text-indigo-600 mt-1">{{ totalActiveDevices.toLocaleString() }}</div>
          <div class="text-[11px] text-muted-foreground mt-1">在线与上报活跃设备</div>
        </ACard>
      </ACol>
    </ARow>

    <!-- 筛选与展示模式切换栏 -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-md border border-border">
      <div class="flex items-center gap-2 flex-1 max-w-md">
        <AInput
          v-model:value="searchKeyword"
          placeholder="搜索应用名称、别名或 AppId..."
          allow-clear
        >
          <template #prefix><SearchIcon class="text-muted-foreground size-4" /></template>
        </AInput>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-xs text-muted-foreground">
          共找到 <strong class="text-foreground">{{ filteredApps.length }}</strong> 个应用
        </span>
        <ARadioGroup v-model:value="viewMode" size="small">
          <ARadioButton value="grid">
            <span class="flex items-center gap-1">
              <GridIcon class="size-3.5 inline" />
              <span>卡片</span>
            </span>
          </ARadioButton>
          <ARadioButton value="table">
            <span class="flex items-center gap-1">
              <ListIcon class="size-3.5 inline" />
              <span>列表</span>
            </span>
          </ARadioButton>
        </ARadioGroup>
      </div>
    </div>

    <!-- 骨架/加载中状态 -->
    <div v-if="loading && applications.length === 0" class="py-12 flex justify-center">
      <ASpin tip="正在加载应用列表..." />
    </div>

    <!-- 空数据提示 -->
    <ACard v-else-if="filteredApps.length === 0" :bordered="false" class="py-12 text-center">
      <AEmpty description="未找到符合条件的应用">
        <AButton type="primary" class="flex items-center gap-1 mx-auto" @click="addModalVisible = true">
          <PlusIcon class="size-3.5" />
          <span>手动添加应用</span>
        </AButton>
      </AEmpty>
    </ACard>

    <!-- 卡片视图模式 (Card Grid) -->
    <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="app in filteredApps"
        :key="app.appId"
        class="group bg-card rounded-lg border border-border/80 hover:border-primary/50 transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden"
      >
        <!-- 卡片头部 -->
        <div class="p-4 border-b border-border/40">
          <div class="flex items-start justify-between gap-2">
            <!-- 头像与名称 -->
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                :class="getAppAvatarBg(app.name)"
              >
                {{ getAppInitials(app.name) }}
              </div>
              <div class="min-w-0">
                <div class="flex items-center gap-1.5">
                  <h3
                    class="font-semibold text-base text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                    :title="app.name"
                    @click="viewAnalysis(app.appId)"
                  >
                    {{ app.name }}
                  </h3>
                  <ATooltip title="修改别名">
                    <EditIcon
                      class="text-xs text-muted-foreground/60 hover:text-primary cursor-pointer shrink-0 transition-colors size-3.5"
                      @click="openEditAlias(app)"
                    />
                  </ATooltip>
                </div>

                <div class="flex items-center gap-1 mt-0.5">
                  <ATag v-if="app.isCustom" color="blue" class="text-[10px] scale-90 origin-left !m-0">自定义别名</ATag>
                  <ATag v-else color="default" class="text-[10px] scale-90 origin-left !m-0">自动生成别名</ATag>
                  <span class="text-[11px] text-muted-foreground/80 truncate font-mono" :title="app.appId">
                    {{ app.appId }}
                  </span>
                  <CopyIcon
                    class="text-[11px] text-muted-foreground/60 hover:text-primary cursor-pointer transition-colors size-3 shrink-0"
                    @click="copyAppId(app.appId)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 关键数据概览 (今日指标) -->
        <div class="p-4 bg-muted/20 flex-1">
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-card/70 p-2 rounded border border-border/40">
              <div class="text-[11px] text-muted-foreground">今日 DAU</div>
              <div class="text-sm font-bold text-foreground mt-0.5">
                {{ overviewMap[app.appId]?.todayDau?.toLocaleString() ?? '-' }}
              </div>
            </div>
            <div class="bg-card/70 p-2 rounded border border-border/40">
              <div class="text-[11px] text-muted-foreground">今日新增</div>
              <div class="text-sm font-bold text-emerald-600 mt-0.5">
                {{ overviewMap[app.appId]?.todayNewUsers?.toLocaleString() ?? '-' }}
              </div>
            </div>
            <div class="bg-card/70 p-2 rounded border border-border/40">
              <div class="text-[11px] text-muted-foreground">活跃设备</div>
              <div class="text-sm font-bold text-indigo-600 mt-0.5">
                {{ overviewMap[app.appId]?.todayActiveDevices?.toLocaleString() ?? '-' }}
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-muted-foreground mt-3 px-1">
            <span>启动次数: <strong class="text-foreground font-mono">{{ overviewMap[app.appId]?.todayLaunchCount ?? '-' }}</strong></span>
            <span>PV: <strong class="text-foreground font-mono">{{ overviewMap[app.appId]?.todayPageViewCount ?? '-' }}</strong></span>
          </div>
        </div>

        <!-- 卡片底部快捷操作 -->
        <div class="p-3 bg-card border-t border-border/40 flex items-center justify-between gap-2">
          <AButton
            type="primary"
            size="small"
            class="flex-1 font-medium flex items-center justify-center gap-1"
            @click="viewAnalysis(app.appId)"
          >
            <ChartIcon class="size-3.5" />
            <span>查看分析</span>
          </AButton>

          <div class="flex items-center gap-1">
            <ATooltip title="活跃分析">
              <AButton size="small" @click="viewAnalysis(app.appId, '/app-statistic/activity')">
                活跃
              </AButton>
            </ATooltip>
            <ATooltip title="设备明细">
              <AButton size="small" @click="viewAnalysis(app.appId, '/app-statistic/devices')">
                设备
              </AButton>
            </ATooltip>
            <ATooltip title="事件日志">
              <AButton size="small" @click="viewAnalysis(app.appId, '/app-statistic/events')">
                事件
              </AButton>
            </ATooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 表格视图模式 (Table View) -->
    <ACard v-else :bordered="false" class="shadow-2xs">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-xs">
          <thead>
            <tr class="border-b border-border bg-muted/40 text-muted-foreground font-medium">
              <th class="p-3">应用名称 / 别名</th>
              <th class="p-3">应用标识 (AppId)</th>
              <th class="p-3 text-right">今日活跃 (DAU)</th>
              <th class="p-3 text-right">今日新增用户</th>
              <th class="p-3 text-right">今日活跃设备</th>
              <th class="p-3 text-right">启动次数</th>
              <th class="p-3 text-right">页面浏览 (PV)</th>
              <th class="p-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/60">
            <tr
              v-for="app in filteredApps"
              :key="app.appId"
              class="hover:bg-muted/30 transition-colors"
            >
              <td class="p-3">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-foreground text-sm">{{ app.name }}</span>
                  <ATag v-if="app.isCustom" color="blue" class="text-[10px]">自定义</ATag>
                  <ATooltip title="修改别名">
                    <EditIcon
                      class="text-xs text-muted-foreground/60 hover:text-primary cursor-pointer size-3.5"
                      @click="openEditAlias(app)"
                    />
                  </ATooltip>
                </div>
              </td>
              <td class="p-3 font-mono text-muted-foreground">
                <div class="flex items-center gap-1.5">
                  <span>{{ app.appId }}</span>
                  <CopyIcon
                    class="cursor-pointer hover:text-primary size-3"
                    @click="copyAppId(app.appId)"
                  />
                </div>
              </td>
              <td class="p-3 text-right font-medium text-foreground">
                {{ overviewMap[app.appId]?.todayDau?.toLocaleString() ?? '-' }}
              </td>
              <td class="p-3 text-right font-medium text-emerald-600">
                {{ overviewMap[app.appId]?.todayNewUsers?.toLocaleString() ?? '-' }}
              </td>
              <td class="p-3 text-right font-medium text-indigo-600">
                {{ overviewMap[app.appId]?.todayActiveDevices?.toLocaleString() ?? '-' }}
              </td>
              <td class="p-3 text-right font-mono text-foreground">
                {{ overviewMap[app.appId]?.todayLaunchCount ?? '-' }}
              </td>
              <td class="p-3 text-right font-mono text-foreground">
                {{ overviewMap[app.appId]?.todayPageViewCount ?? '-' }}
              </td>
              <td class="p-3 text-center">
                <div class="inline-flex items-center gap-1.5">
                  <AButton
                    type="primary"
                    size="small"
                    @click="viewAnalysis(app.appId)"
                  >
                    查看分析
                  </AButton>
                  <AButton
                    size="small"
                    @click="viewAnalysis(app.appId, '/app-statistic/activity')"
                  >
                    活跃分析
                  </AButton>
                  <AButton
                    size="small"
                    @click="viewAnalysis(app.appId, '/app-statistic/devices')"
                  >
                    设备列表
                  </AButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </ACard>

    <!-- 别名编辑弹窗 -->
    <AModal
      v-model:open="editModalVisible"
      title="修改应用别名 / 显示名称"
      ok-text="保存"
      cancel-text="取消"
      @ok="handleSaveAlias"
    >
      <div class="py-2 space-y-3">
        <div>
          <div class="text-xs text-muted-foreground mb-1">应用标识 (AppId)</div>
          <div class="font-mono text-sm font-semibold text-foreground bg-muted/40 p-2 rounded border border-border/50">
            {{ editingAppId }}
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between text-xs text-muted-foreground mb-1">
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
            placeholder="留空则按规范自动生成别名"
            allow-clear
          />
          <div class="text-[11px] text-muted-foreground mt-1">
            当前根据 AppId 自动生成的推荐别名为：
            <span class="font-medium text-foreground">{{ generateAppAlias(editingAppId) }}</span>
          </div>
        </div>
      </div>
    </AModal>

    <!-- 添加应用弹窗 -->
    <AModal
      v-model:open="addModalVisible"
      title="手动添加应用"
      ok-text="添加"
      cancel-text="取消"
      @ok="handleSaveAddApp"
    >
      <div class="py-2 space-y-3">
        <div>
          <div class="text-xs text-muted-foreground mb-1">应用标识 (AppId) *</div>
          <AInput
            v-model:value="newAppId"
            placeholder="例如: com.rctea.im 或 gotoim-app"
            allow-clear
          />
          <div class="text-[11px] text-muted-foreground mt-1">
            作为该应用统计数据的唯一主键标识。
          </div>
        </div>

        <div>
          <div class="text-xs text-muted-foreground mb-1">应用别名 / 显示名称 (选填)</div>
          <AInput
            v-model:value="newAppAlias"
            placeholder="留空则自动按规范生成"
            allow-clear
          />
        </div>
      </div>
    </AModal>
  </div>
</template>
