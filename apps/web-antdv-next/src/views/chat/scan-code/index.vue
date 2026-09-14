<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ScanCodeDto } from '#/api/chat/scan-code';
import type { GeneratedDto } from '#/api/chat/scan-login';

import { onUnmounted, ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  QRCode,
  Select,
  Tabs,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getScanCodeListApi } from '#/api/chat/scan-code';
import {
  cancelScanLoginApi,
  generateScanLoginCodeApi,
  mobileGrantLoginApi,
  mobileScanCodeApi,
} from '#/api/chat/scan-login';

import { useColumns } from './data';
import ScanCodeDrawer from './modules/scan-code-drawer.vue';
import ScanSimulateModal from './modules/scan-simulate-modal.vue';

const activeTab = ref<'login_monitor' | 'logs'>('logs');

// 扫码日志检索
const filterText = ref('');
const actionTypeFilter = ref<number | undefined>(undefined);

const [SimulateModalComp, simulateModalApi] = useVbenModal({
  connectedComponent: ScanSimulateModal,
  destroyOnClose: true,
});

const [DetailDrawerComp, detailDrawerApi] = useVbenDrawer({
  connectedComponent: ScanCodeDrawer,
  destroyOnClose: true,
});

function onDetail(row: ScanCodeDto) {
  detailDrawerApi.setData({ id: row.id }).open();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ScanCodeDto;
}) {
  if (code === 'detail') {
    onDetail(row);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onDetail(params.row as ScanCodeDto);
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
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          return await getScanCodeListApi({
            actionType: actionTypeFilter.value,
            keyword: filterText.value || undefined,
            maxResultCount,
            skipCount,
            sorting: sorting || 'creationTime desc',
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

// 扫码登录调试监视器
const generatedData = ref<GeneratedDto | null>(null);
const monitorLoading = ref(false);
const monitorStatus = ref<'canceled' | 'granted' | 'idle' | 'scanned'>('idle');

async function onGenerateLoginCode() {
  monitorLoading.value = true;
  try {
    generatedData.value = await generateScanLoginCodeApi();
    monitorStatus.value = 'idle';
  } catch (error) {
    console.error('Failed to generate scan login', error);
  } finally {
    monitorLoading.value = false;
  }
}

async function onSimulateMobileScan() {
  if (!generatedData.value?.code) return;
  await mobileScanCodeApi(generatedData.value.code);
  monitorStatus.value = 'scanned';
  message.success('已模拟移动端扫码');
}

async function onSimulateMobileGrant() {
  if (!generatedData.value?.code) return;
  await mobileGrantLoginApi(generatedData.value.code);
  monitorStatus.value = 'granted';
  message.success('已模拟移动端确认授权登录');
}

async function onCancelLogin() {
  if (!generatedData.value?.code) return;
  await cancelScanLoginApi(generatedData.value.code);
  monitorStatus.value = 'canceled';
  message.info('已取消本次扫码会话');
}

onUnmounted(() => {
  // clean
});
</script>

<template>
  <Page auto-content-height>
    <SimulateModalComp @success="gridApi.query" />
    <DetailDrawerComp />

    <div class="h-full flex flex-col bg-background rounded-lg p-2">
      <Tabs v-model:active-key="activeTab" class="flex-1 flex flex-col overflow-hidden">
        <!-- Tab 1: 通用扫码记录与处理器流水 -->
        <Tabs.TabPane key="logs" tab="扫码流水日志" class="h-full flex flex-col">
          <Grid>
            <template #table-title>
              <div class="flex items-center gap-1.5 text-sm font-medium">
                <span class="text-muted-foreground">即时通讯管理</span>
                <span class="text-muted-foreground/60">/</span>
                <span class="font-bold text-base text-foreground">扫码服务流水</span>
              </div>
            </template>

            <template #top>
              <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <Input.Search
                    v-model:value="filterText"
                    placeholder="搜索内容、设备 ID 或用户..."
                    allow-clear
                    class="w-64"
                    @search="() => gridApi.query()"
                  />
                  <Select
                    v-model:value="actionTypeFilter"
                    placeholder="动作类型"
                    allow-clear
                    class="w-32"
                    :options="[
                      { label: '全部', value: undefined },
                      { label: '登录', value: 1 },
                      { label: '加好友', value: 2 },
                      { label: '加入群聊', value: 3 },
                    ]"
                    @change="() => gridApi.query()"
                  />
                </div>
                <div>
                  <Button type="primary" @click="simulateModalApi.open()">
                    模拟扫码测试
                  </Button>
                </div>
              </div>
            </template>
          </Grid>
        </Tabs.TabPane>

        <!-- Tab 2: 扫码登录调试监视 -->
        <Tabs.TabPane key="login_monitor" tab="扫码登录监视器" class="h-full flex flex-col overflow-y-auto p-4">
          <div class="max-w-2xl mx-auto w-full space-y-4">
            <Card title="扫码登录会话状态与生命周期测试" size="small">
              <div class="flex items-center justify-between mb-4">
                <div class="space-x-2">
                  <Button type="primary" :loading="monitorLoading" @click="onGenerateLoginCode">
                    生成新二维码会话
                  </Button>
                  <Button :disabled="!generatedData" @click="onSimulateMobileScan">
                    模拟移动端扫码
                  </Button>
                  <Button :disabled="!generatedData" type="dashed" @click="onSimulateMobileGrant">
                    模拟确认授权
                  </Button>
                  <Button :disabled="!generatedData" danger @click="onCancelLogin">
                    取消
                  </Button>
                </div>
                <div>
                  <Tag v-if="monitorStatus === 'idle'" color="blue">等待扫码</Tag>
                  <Tag v-else-if="monitorStatus === 'scanned'" color="orange">已扫码待确认</Tag>
                  <Tag v-else-if="monitorStatus === 'granted'" color="green">授权成功</Tag>
                  <Tag v-else-if="monitorStatus === 'canceled'" color="red">已取消</Tag>
                </div>
              </div>

              <div v-if="generatedData" class="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/10 space-y-3">
                <QRCode :value="generatedData.actionUrl || generatedData.code" :size="180" />
                <div class="text-xs font-mono text-muted-foreground select-all">
                  Code: {{ generatedData.code }}
                </div>
                <div class="text-xs text-muted-foreground">
                  有效期: {{ generatedData.expires }} 秒
                </div>
              </div>
              <div v-else class="text-center py-10 text-muted-foreground">
                点击上方【生成新二维码会话】开始调试
              </div>
            </Card>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Page>
</template>
