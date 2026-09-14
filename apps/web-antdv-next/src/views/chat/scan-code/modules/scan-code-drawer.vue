<script lang="ts" setup>
import type { ScanCodeDetailDto } from '#/api/chat/scan-code';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Empty, Spin, Tag } from 'antdv-next';

import { getScanCodeDetailApi } from '#/api/chat/scan-code';

const loading = ref(false);
const detail = ref<null | ScanCodeDetailDto>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData() as undefined | { id?: string };
      if (data?.id) {
        loading.value = true;
        try {
          detail.value = await getScanCodeDetailApi(data.id);
        } catch (error) {
          console.error('Failed to get scan code detail', error);
        } finally {
          loading.value = false;
        }
      }
    } else {
      detail.value = null;
    }
  },
});

defineExpose({ drawerApi });
</script>

<template>
  <Drawer title="扫码记录与分发日志" class="w-[600px]">
    <Spin :spinning="loading">
      <div v-if="detail" class="p-5 space-y-5 text-sm">
        <div class="bg-muted/20 p-3 rounded-lg border space-y-2">
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">记录 ID:</span>
            <span class="font-mono text-xs select-all">{{ detail.id }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">业务类型:</span>
            <Tag color="blue">{{ detail.type || '通用' }}</Tag>
          </div>
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">设备 ID:</span>
            <span class="font-mono text-xs">{{ detail.deviceId || '-' }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">操作用户 ID:</span>
            <span class="font-mono text-xs">{{ detail.userId || '-' }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">客户端 ClientId:</span>
            <span class="font-mono text-xs">{{ detail.clientId || '-' }}</span>
          </div>
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">扫描时间:</span>
            <span class="text-xs">{{ detail.creationTime || '-' }}</span>
          </div>
          <div class="py-1">
            <div class="text-muted-foreground text-xs mb-1">扫描原始报文/字符串:</div>
            <div class="p-2 bg-background rounded font-mono text-xs break-all border">
              {{ detail.content || '-' }}
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-sm font-semibold mb-2 text-foreground border-l-3 border-primary pl-2">
            处理器分发结果 (Handler Pipeline: {{ detail.scanHandlerList?.length || 0 }})
          </h4>

          <div v-if="detail.scanHandlerList && detail.scanHandlerList.length > 0" class="space-y-2">
            <div
              v-for="(h, idx) in detail.scanHandlerList"
              :key="idx"
              class="border rounded-md p-3 bg-muted/10 space-y-1.5"
            >
              <div class="flex items-center justify-between">
                <span class="font-medium text-xs font-mono text-foreground">{{ h.handlerFullName }}</span>
                <Tag :color="h.isSuccess ? 'green' : 'red'">
                  {{ h.isSuccess ? '处理成功' : '失败/未命中' }}
                </Tag>
              </div>
              <div v-if="h.message" class="text-xs text-muted-foreground">
                响应消息: {{ h.message }}
              </div>
              <div v-if="h.data" class="p-1.5 bg-background rounded text-xs font-mono break-all overflow-x-auto">
                {{ JSON.stringify(h.data) }}
              </div>
            </div>
          </div>
          <Empty v-else description="无处理器命中" class="py-4" />
        </div>
      </div>
      <Empty v-else-if="!loading" description="未获取到记录详情" />
    </Spin>
  </Drawer>
</template>
