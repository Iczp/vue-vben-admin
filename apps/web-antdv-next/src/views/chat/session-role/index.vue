<script setup lang="ts">
import type { SessionRoleAdminDto } from '#/api/chat/session-role';

import { onMounted, ref } from 'vue';

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
  Table,
  Tag,
} from 'antdv-next';

import {
  getSessionRoleDetailApi,
  getSessionRoleListApi,
} from '#/api/chat/session-role';
import { getRequestErrorMessage } from '#/utils/request-error';

const loading = ref(false);
const keyword = ref('');
const sessionId = ref('');
const isDefault = ref<string | undefined>(undefined);
const items = ref<SessionRoleAdminDto[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 15;
const detailOpen = ref(false);
const detail = ref<SessionRoleAdminDto>();

const columns = [
  { dataIndex: 'name', title: '角色名称' },
  { dataIndex: 'sessionTitle', title: '所属会话' },
  { dataIndex: 'permissionCount', title: '权限数' },
  { key: 'default', title: '默认角色' },
  { dataIndex: 'description', title: '说明' },
  { dataIndex: 'creationTime', title: '创建时间' },
  { key: 'action', title: '操作' },
];

async function loadList() {
  loading.value = true;
  try {
    const res = await getSessionRoleListApi({
      isDefault:
        isDefault.value === undefined ? undefined : isDefault.value === 'true',
      keyword: keyword.value.trim() || undefined,
      maxResultCount: pageSize,
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

async function openDetail(record: SessionRoleAdminDto) {
  try {
    detail.value = await getSessionRoleDetailApi(record.id);
    detailOpen.value = true;
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
    description="查询群会话角色定义、默认标记与授权计数。"
    title="群角色管理"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <Input
          v-model:value="keyword"
          allow-clear
          class="w-56"
          placeholder="搜索角色名称 / 说明"
          @press-enter="
            page = 1;
            loadList();
          "
        />
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
        <Select
          v-model:value="isDefault"
          allow-clear
          class="w-32"
          :options="[
            { label: '默认角色', value: 'true' },
            { label: '普通角色', value: 'false' },
          ]"
          placeholder="默认状态"
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
          <template v-if="column.key === 'default'">
            <Tag :color="record.isDefault ? 'blue' : 'default'">
              {{ record.isDefault ? '是' : '否' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button size="small" type="link" @click="openDetail(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" :width="520" title="群角色详情">
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <DescriptionsItem label="角色 ID">{{ detail.id }}</DescriptionsItem>
        <DescriptionsItem label="名称">{{ detail.name }}</DescriptionsItem>
        <DescriptionsItem label="所属会话">
          {{ detail.sessionTitle || detail.sessionId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="权限数">
          {{ detail.permissionCount }}
        </DescriptionsItem>
        <DescriptionsItem label="说明">
          {{ detail.description || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
