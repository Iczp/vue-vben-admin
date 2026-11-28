<script setup lang="ts">
import type { SessionAdminDto } from '#/api/chat/session';

import { onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Drawer,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import {
  getSessionDetailApi,
  getSessionListApi,
  setSessionIsAllMutedApi,
  setSessionIsEnabledApi,
} from '#/api/chat/session';
import { getRequestErrorMessage } from '#/utils/request-error';

const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const keyword = ref('');
const isEnabled = ref<string | undefined>(undefined);
const items = ref<SessionAdminDto[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 15;
const detailOpen = ref(false);
const detail = ref<SessionAdminDto>();

const columns = [
  { dataIndex: 'title', title: '会话标题' },
  { dataIndex: 'sessionKey', title: 'SessionKey' },
  { dataIndex: 'channel', title: '通道' },
  { dataIndex: 'ownerName', title: '归属主体' },
  { dataIndex: 'messageTotalCount', title: '消息数' },
  { key: 'status', title: '状态' },
  { dataIndex: 'creationTime', title: '创建时间' },
  { key: 'action', title: '操作' },
];

async function loadList() {
  loading.value = true;
  try {
    const res = await getSessionListApi({
      isEnabled:
        isEnabled.value === undefined ? undefined : isEnabled.value === 'true',
      keyword: keyword.value.trim() || undefined,
      maxResultCount: pageSize,
      skipCount: (page.value - 1) * pageSize,
    });
    items.value = res.items;
    total.value = res.totalCount;
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  } finally {
    loading.value = false;
  }
}

async function openDetail(record: SessionAdminDto) {
  try {
    detail.value = await getSessionDetailApi(record.id);
    detailOpen.value = true;
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  }
}

async function toggleEnabled(record: SessionAdminDto) {
  try {
    await setSessionIsEnabledApi(record.id, !record.isEnabled);
    message.success(record.isEnabled ? '会话已停用' : '会话已启用');
    await loadList();
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  }
}

async function toggleAllMuted(record: SessionAdminDto) {
  try {
    await setSessionIsAllMutedApi(record.id, !record.isAllMuted);
    message.success(record.isAllMuted ? '已解除全员禁言' : '已开启全员禁言');
    await loadList();
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  }
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <Page
    description="按标题、SessionKey、主体查询会话档案，支持启停管控与详情核查。"
    title="会话档案管理"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <Input
          v-model:value="keyword"
          allow-clear
          class="w-64"
          placeholder="搜索标题 / SessionKey / 主体"
          @press-enter="
            page = 1;
            loadList();
          "
        />
        <Select
          v-model:value="isEnabled"
          allow-clear
          class="w-36"
          :options="[
            { label: '已启用', value: 'true' },
            { label: '已停用', value: 'false' },
          ]"
          placeholder="启用状态"
        />
        <Button
          type="primary"
          @click="
            page = 1;
            loadList();
          "
        >
          查询
        </Button>
      </div>

      <Table
        :columns="columns"
        :data-source="items"
        :loading="loading"
        :pagination="{
          current: page,
          pageSize,
          total,
          onChange: (p: number) => {
            page = p;
            loadList();
          },
        }"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Space>
              <Tag :color="record.isEnabled ? 'green' : 'red'">
                {{ record.isEnabled ? '启用' : '停用' }}
              </Tag>
              <Tag v-if="record.isAllMuted" color="orange">全员禁言</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="openDetail(record)">
                详情
              </Button>
              <Button
                v-if="hasAccessByCodes(['ChatAdmin.Sessions.SetIsEnabled'])"
                size="small"
                type="link"
                @click="toggleEnabled(record)"
              >
                {{ record.isEnabled ? '停用' : '启用' }}
              </Button>
              <Button
                v-if="hasAccessByCodes(['ChatAdmin.Sessions.SetIsAllMuted'])"
                size="small"
                type="link"
                @click="toggleAllMuted(record)"
              >
                {{ record.isAllMuted ? '解除禁言' : '全员禁言' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" :width="560" title="会话档案详情">
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <DescriptionsItem label="会话 ID">{{ detail.id }}</DescriptionsItem>
        <DescriptionsItem label="标题">
          {{ detail.title || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="SessionKey">
          {{ detail.sessionKey || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="归属主体">
          {{ detail.ownerName || detail.ownerId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="通道">{{ detail.channel }}</DescriptionsItem>
        <DescriptionsItem label="最后消息 ID">
          {{ detail.lastMessageId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="最后序号">
          {{ detail.lastMessageSeq }}
        </DescriptionsItem>
        <DescriptionsItem label="消息总数">
          {{ detail.messageTotalCount }}
        </DescriptionsItem>
        <DescriptionsItem label="说明">
          {{ detail.description || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
