<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AiRunDto } from '#/api/chat/ai-run';

import { ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
  Tabs,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AiRunStatus,
  deleteAiRunApi,
  deleteAiRunManyApi,
  getAiRunListApi,
  retryAiRunApi,
} from '#/api/chat/ai-run';

import { statusOptions, useColumns } from './data';
import AiRunDetailDrawer from './modules/ai-run-detail-drawer.vue';
import AiRunFormModal from './modules/ai-run-form-modal.vue';
import CancelModal from './modules/cancel-modal.vue';

// 状态 Tab 筛选（'all' 或枚举值）
const activeTab = ref<string>('all');

// 搜索栏字段
const filterKeyword = ref('');
const filterProvider = ref<string | undefined>(undefined);
const filterStatus = ref<AiRunStatus | undefined>(undefined);
const filterSessionId = ref('');
const filterSourceMsgId = ref<number | undefined>(undefined);

// 模态框与抽屉管理
const [DetailDrawerComp, detailDrawerApi] = useVbenDrawer({
  connectedComponent: AiRunDetailDrawer,
  destroyOnClose: true,
});

const [FormModalComp, formModalApi] = useVbenModal({
  connectedComponent: AiRunFormModal,
  destroyOnClose: true,
});

const [CancelModalComp, cancelModalApi] = useVbenModal({
  connectedComponent: CancelModal,
  destroyOnClose: true,
});

function onTabChange(key: string | number) {
  const strKey = String(key);
  if (strKey === 'all') {
    filterStatus.value = undefined;
  } else {
    filterStatus.value = Number(strKey) as AiRunStatus;
  }
  gridApi.query();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: AiRunDto;
}) {
  switch (code) {
    case 'detail': {
      detailDrawerApi.setData({ id: row.id }).open();
      break;
    }
    case 'edit': {
      formModalApi.setData({ record: row }).open();
      break;
    }
    case 'cancel': {
      cancelModalApi.setData({ id: row.id }).open();
      break;
    }
    case 'retry': {
      Modal.confirm({
        content: `确定重试 AI 任务 [${row.id}] 吗？`,
        onOk: async () => {
          try {
            await retryAiRunApi(row.id);
            message.success('已触发人工重试');
            gridApi.query();
          } catch (error) {
            console.error('Failed to retry ai run', error);
          }
        },
        title: '人工重试确认',
      });
      break;
    }
    case 'delete': {
      Modal.confirm({
        content: `确定删除该任务记录 [${row.id}] 吗？`,
        okType: 'danger',
        onOk: async () => {
          try {
            await deleteAiRunApi(row.id);
            message.success('删除成功');
            gridApi.query();
          } catch (error) {
            console.error('Failed to delete ai run', error);
          }
        },
        title: '删除任务确认',
      });
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      detailDrawerApi.setData({ id: (params.row as AiRunDto).id }).open();
    },
  },
  gridOptions: {
    checkboxConfig: {
      highlight: true,
      range: true,
    },
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 20,
      pageSizes: [15, 20, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          return await getAiRunListApi({
            keyword: filterKeyword.value.trim() || undefined,
            maxResultCount,
            provider: filterProvider.value || undefined,
            sessionId: filterSessionId.value.trim() || undefined,
            skipCount,
            sorting: sorting || 'creationTime desc',
            sourceMessageId: filterSourceMsgId.value || undefined,
            status: filterStatus.value,
          });
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

async function onBatchDelete() {
  const records = gridApi.grid?.getCheckboxRecords() || [];
  if (records.length === 0) {
    message.warning('请勾选待删除的任务记录');
    return;
  }

  Modal.confirm({
    content: `确定批量删除选中的 ${records.length} 条任务执行记录吗？`,
    okType: 'danger',
    onOk: async () => {
      try {
        const ids = records.map((r: AiRunDto) => r.id);
        await deleteAiRunManyApi(ids);
        message.success(`已删除 ${records.length} 条记录`);
        gridApi.query();
      } catch (error) {
        console.error('Failed to batch delete', error);
      }
    },
    title: '批量删除确认',
  });
}
</script>

<template>
  <Page auto-content-height>
    <FormModalComp @success="() => gridApi.query()" />
    <CancelModalComp @success="() => gridApi.query()" />
    <DetailDrawerComp @reload="() => gridApi.query()" />

    <div class="h-full flex flex-col bg-background rounded-lg p-2">
      <!-- 状态快捷筛选 Tab -->
      <Tabs
        v-model:active-key="activeTab"
        class="px-2"
        @change="onTabChange"
      >
        <Tabs.TabPane key="all" tab="全部任务" />
        <Tabs.TabPane :key="String(AiRunStatus.Queued)" tab="排队中" />
        <Tabs.TabPane :key="String(AiRunStatus.Running)" tab="执行中" />
        <Tabs.TabPane :key="String(AiRunStatus.Completed)" tab="已完成" />
        <Tabs.TabPane :key="String(AiRunStatus.RetryScheduled)" tab="等待重试" />
        <Tabs.TabPane :key="String(AiRunStatus.Failed)" tab="执行失败" />
        <Tabs.TabPane :key="String(AiRunStatus.TimedOut)" tab="执行超时" />
        <Tabs.TabPane :key="String(AiRunStatus.Cancelled)" tab="已取消" />
      </Tabs>

      <Grid>
        <template #table-title>
          <div class="flex items-center gap-1.5 text-sm font-medium">
            <span class="text-muted-foreground">即时通讯管理</span>
            <span class="text-muted-foreground/60">/</span>
            <span class="font-bold text-base text-foreground">AI 任务执行记录</span>
          </div>
        </template>

        <template #top>
          <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
            <div class="flex items-center gap-2 flex-wrap">
              <Input.Search
                v-model:value="filterKeyword"
                placeholder="搜索 LeaseOwner 或错误..."
                allow-clear
                class="w-56"
                @search="() => gridApi.query()"
              />
              <Input
                v-model:value="filterSessionId"
                placeholder="会话 ID (SessionId)"
                allow-clear
                class="w-48"
                @press-enter="() => gridApi.query()"
              />
              <Select
                v-model:value="filterProvider"
                placeholder="AI 驱动"
                allow-clear
                class="w-32"
                :options="[
                  { label: '全部驱动', value: undefined },
                  { label: 'OpenAI', value: 'OpenAI' },
                  { label: 'Claude', value: 'Claude' },
                  { label: 'DeepSeek', value: 'DeepSeek' },
                  { label: 'Qwen', value: 'Qwen' },
                  { label: 'Ollama', value: 'Ollama' },
                  { label: 'Gemini', value: 'Gemini' },
                ]"
                @change="() => gridApi.query()"
              />
              <Select
                v-if="activeTab === 'all'"
                v-model:value="filterStatus"
                placeholder="任务状态"
                allow-clear
                class="w-36"
                :options="statusOptions"
                @change="() => gridApi.query()"
              />
              <Button type="primary" @click="() => gridApi.query()">
                查询
              </Button>
            </div>
            <div class="flex items-center gap-2">
              <Button @click="() => formModalApi.open()">
                新建任务
              </Button>
              <Button danger @click="onBatchDelete">
                批量删除
              </Button>
            </div>
          </div>
        </template>
      </Grid>
    </div>
  </Page>
</template>

