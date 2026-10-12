<script lang="ts" setup>
import type {
  SensitiveWordRulePreviewDto,
  SensitiveWordRuleVersionDto,
  SensitiveWordRuntimeDto,
} from '#/api/cms';

import { onMounted, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import {
  Alert,
  Button,
  Card,
  message,
  Modal,
  Select,
  Spin,
  Tag,
  Tooltip,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getSensitiveWordRuleVersionsApi,
  getSensitiveWordRuntimeApi,
  previewSensitiveWordRuleVersionApi,
  reloadSensitiveWordRuntimeApi,
  type SensitiveWordRuleVersionStatus,
} from '#/api/cms';

import { useColumns, versionStatusOptions } from './data';
import ActivationDrawer from './modules/activation-drawer.vue';
import PublishModal from './modules/publish-modal.vue';
import RollbackModal from './modules/rollback-modal.vue';
import VersionDetailModal from './modules/version-detail-modal.vue';

const preview = ref<SensitiveWordRulePreviewDto | null>(null);
const runtime = ref<SensitiveWordRuntimeDto | null>(null);
const previewLoading = ref(false);
const runtimeReloading = ref(false);

const filters = reactive<{
  status?: SensitiveWordRuleVersionStatus;
}>({
  status: undefined,
});

const [PublishFormModal, publishFormModalApi] = useVbenModal({
  connectedComponent: PublishModal,
  destroyOnClose: true,
});

const [RollbackFormModal, rollbackFormModalApi] = useVbenModal({
  connectedComponent: RollbackModal,
  destroyOnClose: true,
});

const [ActivationHistoryModal, activationHistoryModalApi] = useVbenModal({
  connectedComponent: ActivationDrawer,
  destroyOnClose: true,
});

const [VersionDetailViewModal, versionDetailViewModalApi] = useVbenModal({
  connectedComponent: VersionDetailModal,
  destroyOnClose: true,
});

async function loadPreview() {
  previewLoading.value = true;
  try {
    preview.value = await previewSensitiveWordRuleVersionApi();
  } catch (error) {
    console.error('获取草稿预览失败', error);
  } finally {
    previewLoading.value = false;
  }
}

async function loadRuntime() {
  try {
    runtime.value = await getSensitiveWordRuntimeApi();
  } catch (error) {
    console.error('获取运行时状态失败', error);
  }
}

async function onReloadRuntime() {
  Modal.confirm({
    content: '重新加载将指示所有线上运行节点立即重载并热切换至当前发布的激活版本。确认重载吗？',
    okText: '确认重载',
    title: '重载规则引擎运行时',
    async onOk() {
      runtimeReloading.value = true;
      try {
        await reloadSensitiveWordRuntimeApi();
        message.success('已广播重载指令，运行时已同步最新版本');
        await loadRuntime();
      } catch (error: any) {
        message.error(`重载失败: ${error?.message || error}`);
      } finally {
        runtimeReloading.value = false;
      }
    },
  });
}

function onPublish() {
  publishFormModalApi.open();
}

function onOpenActivations() {
  activationHistoryModalApi.open();
}

function onRollback(row: SensitiveWordRuleVersionDto) {
  rollbackFormModalApi.setData(row).open();
}

function onDetail(row: SensitiveWordRuleVersionDto) {
  versionDetailViewModalApi.setData(row).open();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: SensitiveWordRuleVersionDto;
}) {
  switch (code) {
    case 'detail': {
      onDetail(row);
      break;
    }
    case 'rollback': {
      onRollback(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onDetail(params.row as SensitiveWordRuleVersionDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getSensitiveWordRuleVersionsApi({
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
          });
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

function refreshAll() {
  gridApi.query();
  loadPreview();
  loadRuntime();
}

function onFilterChange() {
  gridApi.reload();
}

onMounted(() => {
  loadPreview();
  loadRuntime();
});
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 顶部草稿状态与运行时指标看板 -->
      <Card
        variant="borderless"
        class="shrink-0 shadow-sm"
        :body-style="{ padding: '14px 18px' }"
      >
        <Spin :spinning="previewLoading">
          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <!-- 草稿与激活版本概况 -->
              <div class="flex flex-wrap items-center gap-6 text-sm">
                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground">当前线上运行版本:</span>
                  <Tag color="success" class="text-sm font-semibold px-2 py-0.5">
                    v{{ runtime?.ruleVersionNumber ?? preview?.activeVersion ?? '-' }}
                  </Tag>
                  <Tooltip v-if="runtime" :title="`耗时: ${runtime.buildDurationMs}ms | 节点数: ${runtime.nodes?.length ?? 1}`">
                    <span class="text-xs text-muted-foreground flex items-center gap-1">
                      <span>● 集群就绪</span>
                    </span>
                  </Tooltip>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground">草稿词条总数:</span>
                  <span class="font-bold text-foreground">{{ preview?.totalWords ?? 0 }}</span>
                  <span class="text-xs text-muted-foreground">（正则 {{ preview?.totalRegexWords ?? 0 }} / 白名单 {{ preview?.totalWhitelists ?? 0 }}）</span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-muted-foreground">草稿修订号:</span>
                  <code class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">#{{ preview?.currentDraftRevision ?? 0 }}</code>
                </div>
              </div>

              <!-- 右侧快捷动作 -->
              <div class="flex items-center gap-2">
                <Button
                  type="primary"
                  :danger="preview?.hasUnpublishedChanges"
                  @click="onPublish"
                >
                  <template #icon><Plus class="size-4" /></template>
                  发布新版本
                </Button>
                <Button @click="onOpenActivations">
                  审计流水
                </Button>
                <Button
                  :loading="runtimeReloading"
                  @click="onReloadRuntime"
                >
                  <template #icon><RotateCw class="size-4" /></template>
                  广播重载
                </Button>
                <Button @click="refreshAll">
                  <template #icon><RotateCw class="size-4" /></template>
                  刷新
                </Button>
              </div>
            </div>

            <!-- 未发布变更预警提示条 -->
            <Alert
              v-if="preview?.hasUnpublishedChanges"
              type="warning"
              show-icon
              class="py-1.5"
            >
              <template #message>
                <span class="font-medium">
                  草稿态有尚未发布的词库变更（自上次发布修订号 #{{ preview?.lastPublishedDraftRevision }} 以来已有增删改）。线上审核仍在使用旧版本，请在测试通过后点击【发布新版本】生效。
                </span>
              </template>
            </Alert>
          </div>
        </Spin>
      </Card>

      <!-- 过滤器与表格操作栏 -->
      <Card
        variant="borderless"
        class="shrink-0 shadow-sm"
        :body-style="{ padding: '10px 16px' }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Select
              v-model:value="filters.status"
              placeholder="版本状态"
              class="w-[160px]"
              allow-clear
              :options="versionStatusOptions"
              @change="onFilterChange"
            />
          </div>
          <div class="text-xs text-muted-foreground">
            提示：双击行可查看版本元数据，支持回滚任意历史稳定版本。
          </div>
        </div>
      </Card>

      <!-- 版本列表主视图 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗挂载 -->
    <PublishFormModal @success="refreshAll" />
    <RollbackFormModal @success="refreshAll" />
    <ActivationHistoryModal />
    <VersionDetailViewModal />
  </Page>
</template>
