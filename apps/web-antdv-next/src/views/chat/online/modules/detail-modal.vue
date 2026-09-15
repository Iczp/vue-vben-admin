<script lang="ts" setup>
import type { ConnectionPoolDto } from '#/api/chat';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Descriptions,
  DescriptionsItem,
  Empty,
  Spin,
  Tag,
} from 'antdv-next';

import { getOnlineConnectionApi } from '#/api/chat';

const loading = ref(false);
const detailData = ref<ConnectionPoolDto | null>(null);

const [Modal, modalApi] = useVbenModal<ConnectionPoolDto | string>({
  fullscreenButton: false,
  async onOpenChange(isOpen) {
    if (isOpen) {
      detailData.value = null;
      const data = modalApi.getData();
      if (!data) return;

      if (typeof data === 'string') {
        try {
          loading.value = true;
          detailData.value = await getOnlineConnectionApi(data);
        } finally {
          loading.value = false;
        }
      } else {
        detailData.value = data;
      }
    } else {
      detailData.value = null;
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="连接池详细信息" class="w-[680px]">
    <Spin :spinning="loading">
      <div v-if="detailData" class="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        <Descriptions title="网络通道信息" bordered size="small" :column="2">
          <DescriptionsItem label="连接 ID (ConnectionId)" :span="2">
            <span class="font-mono text-xs select-all">{{ detailData.connectionId }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="宿主主机 (Host)">
            <Tag color="blue">{{ detailData.host || '-' }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="IP 地址">
            {{ detailData.ipAddress || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="客户端平台">
            <Tag color="green">{{ detailData.platform || '-' }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="设备类型">
            {{ detailData.deviceType || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="设备品牌 / 型号">
            {{ detailData.brand || detailData.model || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="浏览器 / Client">
            {{ detailData.browser || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="连接创建时间">
            {{ detailData.creationTime || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="最后心跳活跃时间">
            {{ detailData.activeTime || '-' }}
          </DescriptionsItem>
        </Descriptions>

        <Descriptions title="关联用户与聊天对象" bordered size="small" :column="2">
          <DescriptionsItem label="用户 ID">
            <span class="font-mono text-xs">{{ detailData.userId || '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="用户登录名">
            <span class="font-medium">{{ detailData.userName || '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="设备唯一 ID" :span="2">
            <span class="font-mono text-xs">{{ detailData.deviceId || '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="推送客户端 ID (PushClientId)" :span="2">
            <span class="font-mono text-xs">{{ detailData.pushClientId || '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="绑定聊天对象 (ChatObjects)" :span="2">
            <div class="flex flex-wrap gap-1.5" v-if="detailData.chatObjectIdList && detailData.chatObjectIdList.length > 0">
              <Tag v-for="objId in detailData.chatObjectIdList" :key="objId" color="purple">
                OwnerId: {{ objId }}
              </Tag>
            </div>
            <span v-else class="text-xs text-muted-foreground">暂无绑定</span>
          </DescriptionsItem>
        </Descriptions>
      </div>
      <Empty v-else-if="!loading" description="未获取到连接信息" class="py-8" />
    </Spin>
  </Modal>
</template>
