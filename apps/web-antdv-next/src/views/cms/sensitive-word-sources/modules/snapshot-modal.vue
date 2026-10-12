<script setup lang="ts">
import type {
  SensitiveWordSourceDto,
  SensitiveWordSourceSnapshotDto,
} from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import { Button, Empty, message, Spin, Table, Tag, Tooltip } from 'antdv-next';

import { getSensitiveWordSourceSnapshotsApi } from '#/api/cms';

const currentSource = ref<SensitiveWordSourceDto | null>(null);
const loading = ref(false);
const snapshots = ref<SensitiveWordSourceSnapshotDto[]>([]);

const columns = [
  {
    dataIndex: 'sourceVersion',
    key: 'sourceVersion',
    title: '版本 / Tag',
    width: 140,
  },
  {
    dataIndex: 'fileCount',
    key: 'fileCount',
    title: '文件数',
    width: 90,
  },
  {
    dataIndex: 'totalBytes',
    key: 'totalBytes',
    title: '数据大小',
    width: 110,
  },
  {
    dataIndex: 'contentHash',
    key: 'contentHash',
    title: '内容哈希 (SHA256)',
    width: 180,
  },
  {
    dataIndex: 'manifestHash',
    key: 'manifestHash',
    title: '清单哈希',
    width: 150,
  },
  {
    dataIndex: 'fetchedTime',
    key: 'fetchedTime',
    title: '抓取时间',
    width: 170,
  },
  {
    dataIndex: 'storageKey',
    key: 'storageKey',
    title: '存储 Key',
    minWidth: 160,
  },
];

function formatBytes(bytes: number) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

async function loadSnapshots(sourceId: string) {
  loading.value = true;
  try {
    snapshots.value = await getSensitiveWordSourceSnapshotsApi(sourceId);
  } catch (error) {
    console.error('获取快照记录失败', error);
    message.error('获取快照记录失败');
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as SensitiveWordSourceDto | null;
      currentSource.value = data || null;
      if (data?.id) {
        modalApi.setState({
          title: `历史快照记录 - ${data.name} (${data.code})`,
        });
        loadSnapshots(data.id);
      }
    } else {
      currentSource.value = null;
      snapshots.value = [];
    }
  },
});
</script>

<template>
  <Modal class="w-[960px]">
    <div class="flex flex-col gap-3 py-2">
      <div class="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          <span>数据源：</span>
          <span class="font-medium text-foreground">{{ currentSource?.name }}</span>
          <span class="ml-2 text-xs">({{ currentSource?.sourceUri }})</span>
        </div>
        <Button
          size="small"
          :loading="loading"
          @click="currentSource?.id && loadSnapshots(currentSource.id)"
        >
          <template #icon><RotateCw class="size-3.5" /></template>
          刷新
        </Button>
      </div>

      <Spin :spinning="loading">
        <Table
          :columns="columns"
          :data-source="snapshots"
          :pagination="{ pageSize: 10, showTotal: (total) => `共 ${total} 条快照` }"
          row-key="id"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'sourceVersion'">
              <Tag color="blue">{{ record.sourceVersion || 'HEAD' }}</Tag>
            </template>

            <template v-else-if="column.key === 'totalBytes'">
              <span>{{ formatBytes(record.totalBytes) }}</span>
            </template>

            <template v-else-if="column.key === 'contentHash'">
              <Tooltip :title="record.contentHash">
                <span class="font-mono text-xs cursor-pointer select-all">
                  {{ record.contentHash ? `${record.contentHash.slice(0, 12)}...` : '-' }}
                </span>
              </Tooltip>
            </template>

            <template v-else-if="column.key === 'manifestHash'">
              <Tooltip :title="record.manifestHash">
                <span class="font-mono text-xs cursor-pointer select-all">
                  {{ record.manifestHash ? `${record.manifestHash.slice(0, 10)}...` : '-' }}
                </span>
              </Tooltip>
            </template>

            <template v-else-if="column.key === 'fetchedTime'">
              <span class="text-xs text-muted-foreground">{{ record.fetchedTime }}</span>
            </template>

            <template v-else-if="column.key === 'storageKey'">
              <span class="text-xs text-muted-foreground break-all">{{ record.storageKey || '-' }}</span>
            </template>
          </template>

          <template #emptyText>
            <Empty description="暂无抓取快照记录" />
          </template>
        </Table>
      </Spin>
    </div>
  </Modal>
</template>
