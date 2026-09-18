<script lang="ts" setup>
import type { ChatObjectDto, ConnectionPoolDto } from '#/api/chat';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Avatar,
  Descriptions,
  DescriptionsItem,
  Empty,
  Spin,
  Tag,
} from 'antdv-next';

import {
  ChatObjectTypeEnums,
  getChatObjectApi,
  getChatObjectAvatarUrl,
  getOnlineConnectionApi,
} from '#/api/chat';
import {
  getObjectTypeName,
  getObjectTypeColor,
} from '#/views/chat/chat-object/data';

const loading = ref(false);
const detailData = ref<ConnectionPoolDto | null>(null);
const boundChatObjects = ref<ChatObjectDto[]>([]);
const chatObjectsLoading = ref(false);

// 内存缓存，避免同个连接重复打开时重复请求
const chatObjectCache = new Map<number | string, ChatObjectDto>();

async function fetchBoundChatObjects(idList: number[]) {
  if (!idList || idList.length === 0) {
    boundChatObjects.value = [];
    return;
  }
  chatObjectsLoading.value = true;
  boundChatObjects.value = [];
  try {
    const fetchPromises = idList.map(async (id) => {
      if (chatObjectCache.has(id)) {
        return chatObjectCache.get(id)!;
      }
      try {
        const obj = await getChatObjectApi(id);
        if (obj) {
          chatObjectCache.set(id, obj);
          return obj;
        }
      } catch (err) {
        console.warn(`Failed to fetch chat object id=${id}`, err);
      }
      return {
        displayName: `Owner #${id}`,
        id,
        isEnabled: true,
        name: `ID: ${id}`,
        objectType: ChatObjectTypeEnums.Personal,
      } as ChatObjectDto;
    });

    const list = await Promise.all(fetchPromises);
    boundChatObjects.value = list.filter(Boolean);
  } finally {
    chatObjectsLoading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal<ConnectionPoolDto | string>({
  fullscreenButton: false,
  async onOpenChange(isOpen) {
    if (isOpen) {
      detailData.value = null;
      boundChatObjects.value = [];
      const data = modalApi.getData();
      if (!data) return;

      if (typeof data === 'string') {
        try {
          loading.value = true;
          const res = await getOnlineConnectionApi(data);
          detailData.value = res;
          if (res?.chatObjectIdList && res.chatObjectIdList.length > 0) {
            fetchBoundChatObjects(res.chatObjectIdList);
          }
        } finally {
          loading.value = false;
        }
      } else {
        detailData.value = data;
        if (data?.chatObjectIdList && data.chatObjectIdList.length > 0) {
          fetchBoundChatObjects(data.chatObjectIdList);
        }
      }
    } else {
      detailData.value = null;
      boundChatObjects.value = [];
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
            <!-- 加载状态 -->
            <div v-if="chatObjectsLoading" class="flex items-center gap-2 py-2">
              <Spin size="small" />
              <span class="text-xs text-muted-foreground">正在获取聊天对象数据...</span>
            </div>
            <!-- 聊天对象列表展示 (带头像与类型) -->
            <div
              v-else-if="boundChatObjects && boundChatObjects.length > 0"
              class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full mt-1"
            >
              <div
                v-for="item in boundChatObjects"
                :key="item.id"
                class="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
              >
                <!-- 显示头像 -->
                <Avatar
                  :src="getChatObjectAvatarUrl(item.id, item.portrait, item.thumbnail)"
                  shape="square"
                  :size="42"
                  class="shrink-0 rounded-md border border-border/60 font-bold"
                  :style="{ backgroundColor: '#3b82f6' }"
                >
                  {{ (item.displayName || item.name || '客').slice(0, 1).toUpperCase() }}
                </Avatar>

                <!-- 对象详情 -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      class="font-medium text-xs text-foreground truncate"
                      :title="item.displayName || item.name"
                    >
                      {{ item.displayName || item.name }}
                    </span>
                    <Tag
                      :color="getObjectTypeColor(item.objectType)"
                      class="mr-0 text-[10px] px-1 py-0 leading-tight"
                    >
                      {{ getObjectTypeName(item.objectType) }}
                    </Tag>
                  </div>
                  <div class="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span class="font-mono">
                      OwnerId: <strong class="text-foreground">{{ item.id }}</strong>
                    </span>
                    <Tag
                      :color="item.isEnabled ? 'success' : 'error'"
                      class="mr-0 text-[10px] px-1 py-0 leading-tight scale-90"
                    >
                      {{ item.isEnabled ? '启用' : '禁用' }}
                    </Tag>
                  </div>
                </div>
              </div>
            </div>
            <!-- 仅在没有任何 ID 时提示 -->
            <span v-else class="text-xs text-muted-foreground">暂无绑定</span>
          </DescriptionsItem>
        </Descriptions>
      </div>
      <Empty v-else-if="!loading" description="未获取到连接信息" class="py-8" />
    </Spin>
  </Modal>
</template>
