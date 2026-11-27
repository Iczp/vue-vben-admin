<script setup lang="ts">
import type {
  MessageAdminDetailDto,
  MessageAdminListItemDto,
} from '#/api/chat/message';

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
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import {
  getMessageAdminDetailApi,
  getMessageAdminListApi,
  rollbackMessageAdminApi,
} from '#/api/chat/message';
import { getRequestErrorMessage } from '#/utils/request-error';

const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const sessionId = ref('');
const senderId = ref('');
const isRollbacked = ref<string | undefined>(undefined);
const items = ref<MessageAdminListItemDto[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 15;
const detailOpen = ref(false);
const detail = ref<MessageAdminDetailDto>();

const columns = [
  { dataIndex: 'id', title: '消息 ID' },
  { dataIndex: 'sessionSeq', title: '会话序号' },
  { dataIndex: 'senderName', title: '发送方' },
  { dataIndex: 'receiverName', title: '接收方' },
  { dataIndex: 'messageType', title: '类型' },
  { key: 'state', title: '状态' },
  { dataIndex: 'creationTime', title: '发送时间' },
  { key: 'action', title: '操作' },
];

async function loadList() {
  loading.value = true;
  try {
    const res = await getMessageAdminListApi({
      isRollbacked:
        isRollbacked.value === undefined
          ? undefined
          : isRollbacked.value === 'true',
      maxResultCount: pageSize,
      senderId: senderId.value.trim() || undefined,
      sessionId: sessionId.value.trim() || undefined,
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

async function openDetail(record: MessageAdminListItemDto) {
  try {
    detail.value = await getMessageAdminDetailApi(record.id);
    detailOpen.value = true;
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  }
}

function confirmRollback(record: MessageAdminListItemDto) {
  Modal.confirm({
    content: `确定要撤回消息 ${record.id} 吗？`,
    onOk: async () => {
      await rollbackMessageAdminApi(record.id);
      message.success('消息已撤回');
      await loadList();
    },
    title: '撤回确认',
  });
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <Page
    description="按会话、发送者及撤回状态定向检索消息档案，支持管理端撤回与详情取证。"
    title="消息档案查询"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <Input
          v-model:value="sessionId"
          allow-clear
          class="w-64"
          placeholder="按 SessionId 过滤"
          @press-enter="
            page = 1;
            loadList();
          "
        />
        <Input
          v-model:value="senderId"
          allow-clear
          class="w-48"
          placeholder="按发送者 ID 过滤"
          @press-enter="
            page = 1;
            loadList();
          "
        />
        <Select
          v-model:value="isRollbacked"
          allow-clear
          class="w-36"
          :options="[
            { label: '正常消息', value: 'false' },
            { label: '已撤回', value: 'true' },
          ]"
          placeholder="撤回状态"
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
          <template v-if="column.key === 'state'">
            <Space>
              <Tag :color="record.isRollbacked ? 'red' : 'green'">
                {{ record.isRollbacked ? '已撤回' : '正常' }}
              </Tag>
              <Tag v-if="record.isPrivate" color="purple">私密</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="openDetail(record)">
                详情
              </Button>
              <Button
                v-if="
                  !record.isRollbacked &&
                  hasAccessByCodes(['ChatAdmin.Messages.Rollback'])
                "
                danger
                size="small"
                type="link"
                @click="confirmRollback(record)"
              >
                撤回
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" :width="600" title="消息档案详情">
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <DescriptionsItem label="消息 ID">{{ detail.id }}</DescriptionsItem>
        <DescriptionsItem label="会话 ID">
          {{ detail.sessionId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="会话序号">
          {{ detail.sessionSeq }}
        </DescriptionsItem>
        <DescriptionsItem label="ClientMessageId">
          {{ detail.clientMessageId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="发送方">
          {{ detail.senderName || detail.senderId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="内容快照">
          <pre class="max-h-60 overflow-auto whitespace-pre-wrap text-xs">{{
            detail.contentJson || '-'
          }}</pre>
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
