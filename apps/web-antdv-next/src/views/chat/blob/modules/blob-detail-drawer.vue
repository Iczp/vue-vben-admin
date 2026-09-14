<script lang="ts" setup>
import type { BlobDetailDto } from '#/api/chat/blob';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Empty, Spin, Tag } from 'antdv-next';

import { getBlobDetailApi } from '#/api/chat/blob';

import { formatBytes } from '../data';

const loading = ref(false);
const detail = ref<BlobDetailDto | null>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData() as undefined | { id?: string };
      if (data?.id) {
        loading.value = true;
        try {
          detail.value = await getBlobDetailApi(data.id);
        } catch (error) {
          console.error('Failed to get blob detail', error);
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
  <Drawer title="对象存储元数据详情" class="w-[560px]">
    <Spin :spinning="loading">
      <div v-if="detail" class="p-5 space-y-4 text-sm">
        <div class="bg-muted/20 p-3 rounded-lg border space-y-2">
          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">原始文件名:</span>
            <span class="font-medium text-foreground">{{ detail.fileName || '-' }}</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">对象 ID:</span>
            <span class="font-mono text-xs select-all">{{ detail.id }}</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">存储容器 (Container):</span>
            <Tag color="blue">{{ detail.container || 'default' }}</Tag>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">存储内部名称:</span>
            <span class="font-mono text-xs">{{ detail.name || '-' }}</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">文件大小:</span>
            <span class="font-bold">{{ formatBytes(detail.fileSize) }} ({{ detail.fileSize ?? 0 }} Bytes)</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">MIME 类型:</span>
            <span class="font-mono text-xs">{{ detail.mimeType || '-' }}</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">文件后缀:</span>
            <span>{{ detail.suffix || '-' }}</span>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">公开访问策略:</span>
            <Tag :color="detail.isPublic ? 'green' : 'default'">
              {{ detail.isPublic ? '完全公开' : '鉴权私有' }}
            </Tag>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">静态资源托管:</span>
            <Tag :color="detail.isStatic ? 'cyan' : 'default'">
              {{ detail.isStatic ? '是 (Static)' : '否' }}
            </Tag>
          </div>

          <div class="flex items-center justify-between py-1 border-b">
            <span class="text-muted-foreground">上传/创建时间:</span>
            <span class="text-xs">{{ detail.creationTime || '-' }}</span>
          </div>

          <div class="flex items-center justify-between py-1">
            <span class="text-muted-foreground">上传用户 ID:</span>
            <span class="text-xs font-mono">{{ detail.creatorId || '-' }}</span>
          </div>
        </div>
      </div>
      <Empty v-else-if="!loading" description="未获取到对象详情" />
    </Spin>
  </Drawer>
</template>
