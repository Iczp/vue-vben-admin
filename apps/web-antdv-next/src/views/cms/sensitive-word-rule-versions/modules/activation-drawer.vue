<script setup lang="ts">
import type { SensitiveWordRuleActivationDto } from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import { Button, Empty, message, Spin, Table, Tag, Tooltip } from 'antdv-next';

import {
  getSensitiveWordRuleActivationsApi,
} from '#/api/cms';

import { activationActionOptions } from '../data';

const loading = ref(false);
const activations = ref<SensitiveWordRuleActivationDto[]>([]);

const columns = [
  {
    dataIndex: 'activationSequence',
    key: 'activationSequence',
    title: '流水号',
    width: 80,
  },
  {
    dataIndex: 'action',
    key: 'action',
    title: '触发动作',
    width: 120,
  },
  {
    dataIndex: 'toVersionId',
    key: 'toVersionId',
    title: '激活版本',
    width: 110,
  },
  {
    dataIndex: 'fromVersionId',
    key: 'fromVersionId',
    title: '来源版本',
    width: 110,
  },
  {
    dataIndex: 'contentHash',
    key: 'contentHash',
    title: '规则集 Hash',
    width: 140,
  },
  {
    dataIndex: 'activatedTime',
    key: 'activatedTime',
    title: '生效时间',
    width: 170,
  },
  {
    dataIndex: 'reason',
    key: 'reason',
    minWidth: 160,
    title: '说明 / 原因',
  },
];

async function loadActivations() {
  loading.value = true;
  try {
    activations.value = await getSensitiveWordRuleActivationsApi();
  } catch (error) {
    console.error('获取版本激活流水失败', error);
    message.error('获取版本激活流水失败');
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: true,
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      modalApi.setState({ title: '版本激活与回滚审计流水' });
      loadActivations();
    } else {
      activations.value = [];
    }
  },
});
</script>

<template>
  <Modal class="w-[960px]">
    <div class="flex flex-col gap-3 py-2">
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <span>展示所有历史发布与回滚的线性递增序列（Activation Sequence），支持溯源审计。</span>
        <Button size="small" :loading="loading" @click="loadActivations">
          <template #icon><RotateCw class="size-3.5" /></template>
          刷新流水
        </Button>
      </div>

      <Spin :spinning="loading">
        <Table
          :columns="columns"
          :data-source="activations"
          :pagination="{ pageSize: 10, showTotal: (total) => `共 ${total} 次激活事件` }"
          row-key="id"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'activationSequence'">
              <Tag color="purple">#{{ record.activationSequence }}</Tag>
            </template>

            <template v-else-if="column.key === 'action'">
              <Tag
                :color="activationActionOptions.find(o => o.value === record.action)?.color"
              >
                {{ activationActionOptions.find(o => o.value === record.action)?.label || record.action }}
              </Tag>
            </template>

            <template v-else-if="column.key === 'toVersionId'">
              <span class="font-mono text-xs">{{ record.toVersionId?.slice(0, 8) }}</span>
            </template>

            <template v-else-if="column.key === 'fromVersionId'">
              <span class="font-mono text-xs">{{ record.fromVersionId ? record.fromVersionId.slice(0, 8) : '-' }}</span>
            </template>

            <template v-else-if="column.key === 'contentHash'">
              <Tooltip :title="record.contentHash">
                <span class="font-mono text-xs cursor-pointer select-all">
                  {{ record.contentHash ? `${record.contentHash.slice(0, 10)}...` : '-' }}
                </span>
              </Tooltip>
            </template>

            <template v-else-if="column.key === 'activatedTime'">
              <span class="text-xs text-muted-foreground">{{ record.activatedTime }}</span>
            </template>

            <template v-else-if="column.key === 'reason'">
              <span class="text-xs">{{ record.reason || '-' }}</span>
            </template>
          </template>

          <template #emptyText>
            <Empty description="暂无版本激活历史" />
          </template>
        </Table>
      </Spin>
    </div>
  </Modal>
</template>
