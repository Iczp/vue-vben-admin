<script setup lang="ts">
import type { SessionRequestAdminDto } from '#/api/chat/session-request';

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
  getSessionRequestDetailApi,
  getSessionRequestListApi,
  handleSessionRequestApi,
} from '#/api/chat/session-request';
import { getRequestErrorMessage } from '#/utils/request-error';

const { hasAccessByCodes } = useAccess();
const loading = ref(false);
const keyword = ref('');
const isHandled = ref<string | undefined>(undefined);
const items = ref<SessionRequestAdminDto[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 15;
const detailOpen = ref(false);
const detail = ref<SessionRequestAdminDto>();

const columns = [
  { dataIndex: 'ownerName', title: '发起方' },
  { dataIndex: 'destinationName', title: '目标方' },
  { dataIndex: 'requestMessage', title: '申请说明' },
  { key: 'state', title: '处理状态' },
  { dataIndex: 'creationTime', title: '申请时间' },
  { key: 'action', title: '操作' },
];

async function loadList() {
  loading.value = true;
  try {
    const res = await getSessionRequestListApi({
      isHandled:
        isHandled.value === undefined ? undefined : isHandled.value === 'true',
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

async function openDetail(record: SessionRequestAdminDto) {
  try {
    detail.value = await getSessionRequestDetailApi(record.id);
    detailOpen.value = true;
  } catch (err) {
    message.error(getRequestErrorMessage(err).message);
  }
}

function confirmHandle(record: SessionRequestAdminDto, isAgreed: boolean) {
  Modal.confirm({
    content: `确定${isAgreed ? '同意' : '拒绝'}来自 ${record.ownerName || record.ownerId} 的申请吗？`,
    onOk: async () => {
      await handleSessionRequestApi(record.id, {
        handleMessage: isAgreed ? '管理员同意' : '管理员拒绝',
        isAgreed,
      });
      message.success(isAgreed ? '已同意申请' : '已拒绝申请');
      await loadList();
    },
    title: '审批确认',
  });
}

onMounted(() => {
  void loadList();
});
</script>

<template>
  <Page
    description="查询入群申请与好友验证工单记录、处理结果与过期状态。"
    title="入群与好友申请"
  >
    <Card>
      <div class="mb-4 flex flex-wrap items-center gap-2">
        <Input
          v-model:value="keyword"
          allow-clear
          class="w-64"
          placeholder="搜索发起方 / 目标方 / 申请附言"
          @press-enter="
            page = 1;
            loadList();
          "
        />
        <Select
          v-model:value="isHandled"
          allow-clear
          class="w-36"
          :options="[
            { label: '待处理', value: 'false' },
            { label: '已处理', value: 'true' },
          ]"
          placeholder="处理状态"
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
              <Tag :color="record.isHandled ? 'blue' : 'gold'">
                {{ record.isHandled ? '已处理' : '待处理' }}
              </Tag>
              <Tag
                v-if="record.isHandled"
                :color="record.isAgreed ? 'green' : 'red'"
              >
                {{ record.isAgreed ? '已同意' : '已拒绝' }}
              </Tag>
              <Tag v-if="record.isExpired" color="default">已过期</Tag>
            </Space>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="openDetail(record)">
                详情
              </Button>
              <Button
                v-if="
                  !record.isHandled &&
                  !record.isExpired &&
                  hasAccessByCodes(['ChatAdmin.SessionRequests.Handle'])
                "
                size="small"
                type="link"
                @click="confirmHandle(record, true)"
              >
                同意
              </Button>
              <Button
                v-if="
                  !record.isHandled &&
                  !record.isExpired &&
                  hasAccessByCodes(['ChatAdmin.SessionRequests.Handle'])
                "
                danger
                size="small"
                type="link"
                @click="confirmHandle(record, false)"
              >
                拒绝
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer v-model:open="detailOpen" :width="520" title="申请记录详情">
      <Descriptions v-if="detail" :column="1" bordered size="small">
        <DescriptionsItem label="记录 ID">{{ detail.id }}</DescriptionsItem>
        <DescriptionsItem label="发起方">
          {{ detail.ownerName || detail.ownerId }}
        </DescriptionsItem>
        <DescriptionsItem label="目标方">
          {{ detail.destinationName || detail.destinationId || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="申请说明">
          {{ detail.requestMessage || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="处理意见">
          {{ detail.handleMessage || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="处理时间">
          {{ detail.handleTime || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="过期时间">
          {{ detail.expirationTime || '-' }}
        </DescriptionsItem>
      </Descriptions>
    </Drawer>
  </Page>
</template>
