<script lang="ts" setup>
import type { SecurityLogDto } from '#/api/logmanagement';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Tag } from 'antdv-next';

const log = ref<SecurityLogDto | null>(null);

const [Modal, modalApi] = useVbenModal<SecurityLogDto | null>({
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      log.value = modalApi.getData() || null;
    } else {
      log.value = null;
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="安全日志详情" class="w-[600px]">
    <div class="p-4 space-y-3 text-sm">
      <div class="grid grid-cols-2 gap-3">
        <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground mr-2">操作行为:</span>
          <Tag color="blue">{{ log?.action }}</Tag>
        </div>
        <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground mr-2">操作用户:</span>
          <span class="font-medium">{{ log?.userName || '-' }}</span>
        </div>
        <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground mr-2">客户端 IP:</span>
          <span class="font-mono">{{ log?.extraProperties?.ClientIpAddress || '-' }}</span>
        </div>
        <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground mr-2">记录时间:</span>
          <span>{{ log?.creationTime }}</span>
        </div>
        <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground mr-2">应用标识:</span>
          <span>{{ log?.applicationName || '-' }}</span>
        </div>
        <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground mr-2">身份类别:</span>
          <span>{{ log?.identity || '-' }}</span>
        </div>
        <div class="col-span-2 border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
          <span class="text-muted-foreground block mb-1">客户端/浏览器信息:</span>
          <span class="text-xs text-muted-foreground break-all">{{ log?.browserInfo || '-' }}</span>
        </div>
      </div>
    </div>
  </Modal>
</template>
