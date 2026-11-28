<script setup lang="ts">
import type { SessionAnnouncementAdminDto } from '#/api/chat/session-announcement';

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
  getSessionAnnouncementDetailApi,
  getSessionAnnouncementListApi,
  setSessionAnnouncementPinnedApi,
} from '#/api/chat/session-announcement';
import { getRequestErrorMessage } from '#/utils/request-error';

const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const keyword = ref('');
const isPinned = ref<string | undefined>(undefined);
const items = ref<SessionAnnouncementAdminDto[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 15;
const detailOpen = ref(false);
const detail = ref<SessionAnnouncementAdminDto>();

const columns = [
  { dataIndex: 'title', title: '公告标题' },
  { dataIndex: 'sessionTitle', title: '所属群会话' },
  { dataIndex: 'publisherName', title: '发布人' },
  { dataIndex: 'version', title: '版本' },
  { key: 'flags', title: '标记' },
  { dataIndex: 'readCount', title: '已读/确认' },
  { dataIndex: 'creationTime', title: '创建时间' },
  { key: 'action', title: '操作' },
];

async function loadList() {
  loading.value = true;
  try {
    const res = await getSessionAnnouncementListApi({
      isPinned:
        isPinned.value === undefined ? undefined : isPinned.value === 'true',
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

async function openDetail(record: SessionAnnouncementAdminDto) {
  try {
    detail.value = await getSessionAnnouncementDetailApi(record.id);
    detailOpen.value = true;
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  }
}

async function togglePinned(record: SessionAnnouncementAdminDto) {
  try {
    await setSessionAnnouncementPinnedApi(record.id, !record.isPinned);
    message.success(record.isPinned ? '已取消置顶' : '已置顶公告');
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
    description="查询群公告发布版本、置顶与审核状态、阅读确认统计。"
    title="群公告管理"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <Input
          v-model:value="keyword"
          allow-clear
          class="w-64"
          placeholder="搜索公告标题 / 正文"
          @press-enter="
            page = 1;
            loadList();
          "
        />
        <Select
          v-model:value="isPinned"
          allow-clear
          class="w-32"
          :options="[
            { label: '已置顶', value: 'true' },
            { label: '未置顶', value: 'false' },
          ]"
          placeholder="置顶状态"
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
          <template v-if="column.key === 'flags'">
            <Space>
              <Tag v-if="record.isPinned" color="blue">置顶</Tag>
              <Tag :color="record.isApproved ? 'green' : 'gold'">
                {{ record.isApproved ? '已审核' : '待审核' }}
              </Tag>
            </Space>
          </template>
          <template v-else-if="column.dataIndex === 'readCount'">
            {{ record.readCount }} / {{ record.confirmedCount }}
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="openDetail(record)">
                详情
              </Button>
              <Button
                v-if="
                  hasAccessByCodes(['ChatAdmin.SessionAnnouncements.Pin'])
                "
                size="small"
                type="link"
                @click="togglePinned(record)"
              >
                {{ record.isPinned ? '取消置顶' : '置顶' }}
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" :width="560" title="群公告详情">
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <DescriptionsItem label="公告 ID">{{ detail.id }}</DescriptionsItem>
        <DescriptionsItem label="标题">{{ detail.title }}</DescriptionsItem>
        <DescriptionsItem label="所属会话">
          {{ detail.sessionTitle || detail.sessionId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="发布人">
          {{ detail.publisherName || detail.publisherChatObjectId }}
        </DescriptionsItem>
        <DescriptionsItem label="版本">v{{ detail.version }}</DescriptionsItem>
        <DescriptionsItem label="正文">
          <div class="whitespace-pre-wrap">{{ detail.content }}</div>
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
