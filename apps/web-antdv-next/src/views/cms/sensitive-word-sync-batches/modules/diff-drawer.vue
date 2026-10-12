<script setup lang="ts">
import type {
  SensitiveWordSyncBatchDetailDto,
  SensitiveWordSyncItemDto,
} from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';
import { Check, X } from 'lucide-vue-next';

import {
  Alert,
  Badge,
  Button,
  Card,
  Empty,
  message,
  Modal as AntModal,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'antdv-next';

import {
  applySensitiveWordSyncBatchApi,
  getSensitiveWordSyncBatchApi,
  getSensitiveWordSyncBatchItemsApi,
  ignoreSensitiveWordSyncBatchApi,
  SensitiveWordBatchStatus,
  SensitiveWordChangeType,
} from '#/api/cms';

import {
  actionOptions,
  riskLevelOptions,
  sceneOptions,
} from '../../sensitive-words/data';
import { applyStatusOptions, batchStatusOptions, changeTypeOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const currentBatch = ref<SensitiveWordSyncBatchDetailDto | null>(null);
const loading = ref(false);
const itemsLoading = ref(false);
const activeTab = ref('all');

const itemsData = ref<SensitiveWordSyncItemDto[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 15,
  total: 0,
});

const columns = [
  {
    dataIndex: 'word',
    key: 'word',
    minWidth: 140,
    title: '词条内容',
  },
  {
    dataIndex: 'normalizedWord',
    key: 'normalizedWord',
    minWidth: 140,
    title: '归一化词',
  },
  {
    dataIndex: 'isRegex',
    key: 'isRegex',
    title: '匹配模式',
    width: 95,
  },
  {
    dataIndex: 'categoryChange',
    key: 'categoryChange',
    minWidth: 160,
    title: '分类映射',
  },
  {
    dataIndex: 'suggestedRiskLevel',
    key: 'suggestedRiskLevel',
    title: '建议风险',
    width: 100,
  },
  {
    dataIndex: 'suggestedAction',
    key: 'suggestedAction',
    title: '建议动作',
    width: 110,
  },
  {
    dataIndex: 'suggestedScene',
    key: 'suggestedScene',
    title: '场景',
    width: 120,
  },
  {
    dataIndex: 'changeType',
    key: 'changeType',
    title: '变更类型',
    width: 95,
  },
  {
    dataIndex: 'hasConflict',
    key: 'hasConflict',
    title: '冲突状态',
    width: 120,
  },
  {
    dataIndex: 'applyStatus',
    key: 'applyStatus',
    title: '应用状态',
    width: 100,
  },
];

async function loadBatchDetail(id: string) {
  loading.value = true;
  try {
    currentBatch.value = await getSensitiveWordSyncBatchApi(id);
  } catch (error) {
    console.error('获取批次详情失败', error);
  } finally {
    loading.value = false;
  }
}

async function loadItems() {
  if (!currentBatch.value?.id) return;
  itemsLoading.value = true;

  let changeType: SensitiveWordChangeType | undefined;
  let hasConflict: boolean | undefined;

  switch (activeTab.value) {
    case 'added': {
      changeType = SensitiveWordChangeType.Added;
      break;
    }
    case 'conflicts': {
      hasConflict = true;
      break;
    }
    case 'deleted': {
      changeType = SensitiveWordChangeType.Removed;
      break;
    }
    case 'modified': {
      changeType = SensitiveWordChangeType.Updated;
      break;
    }
    default: {
      break;
    }
  }

  try {
    const res = await getSensitiveWordSyncBatchItemsApi(currentBatch.value.id, {
      changeType,
      hasConflict,
      maxResultCount: pagination.pageSize,
      skipCount: (pagination.current - 1) * pagination.pageSize,
    });
    itemsData.value = res.items || [];
    pagination.total = res.totalCount || 0;
  } catch (error) {
    console.error('获取批次差异明细失败', error);
  } finally {
    itemsLoading.value = false;
  }
}

function handleTabChange(key: any) {
  activeTab.value = key;
  pagination.current = 1;
  loadItems();
}

function handleTableChange(pag: any) {
  pagination.current = pag.current;
  pagination.pageSize = pag.pageSize;
  loadItems();
}

function onApplyBatch() {
  if (!currentBatch.value?.id) return;
  const batchId = currentBatch.value.id;
  AntModal.confirm({
    content: `确认将该批次（${currentBatch.value.totalCount} 项差异）应用到敏感词草稿态吗？已锁定的敏感词将被保护跳过。应用完成后需在【规则版本】中发布生效。`,
    okText: '确认应用',
    title: '应用同步差异批次',
    async onOk() {
      try {
        message.loading({ content: '正在应用变更到敏感词库...', key: 'apply-batch' });
        await applySensitiveWordSyncBatchApi(batchId);
        message.success({ content: '批次应用成功！草稿态已更新，可前往版本中心发布上线。', key: 'apply-batch' });
        await loadBatchDetail(batchId);
        await loadItems();
        emit('success');
      } catch (error: any) {
        message.error({ content: `应用失败: ${error?.message || error}`, key: 'apply-batch' });
      }
    },
  });
}

function onIgnoreBatch() {
  if (!currentBatch.value?.id) return;
  const batchId = currentBatch.value.id;
  AntModal.confirm({
    content: '确认忽略本批次变更吗？忽略后该批次的词条将不会合并到敏感词库。',
    okText: '确认忽略',
    okType: 'danger',
    title: '忽略同步差异批次',
    async onOk() {
      try {
        await ignoreSensitiveWordSyncBatchApi(batchId, { remark: '人工审核主动忽略' });
        message.success('已忽略该批次');
        await loadBatchDetail(batchId);
        await loadItems();
        emit('success');
      } catch (error: any) {
        message.error(`忽略失败: ${error?.message || error}`);
      }
    },
  });
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: true,
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id: string } | undefined;
      if (data?.id) {
        modalApi.setState({ title: `审查词库同步差异批次 [${data.id.slice(0, 8)}]` });
        activeTab.value = 'all';
        pagination.current = 1;
        loadBatchDetail(data.id).then(() => {
          loadItems();
        });
      }
    } else {
      currentBatch.value = null;
      itemsData.value = [];
    }
  },
});
</script>

<template>
  <Modal class="w-[1100px]">
    <div class="flex flex-col gap-4 py-2">
      <!-- 概览看板 -->
      <Spin :spinning="loading">
        <Card size="small" variant="borderless" class="bg-gray-50/70 dark:bg-gray-900/60 border">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-col gap-1.5 text-sm">
              <div class="flex items-center gap-3">
                <span class="font-semibold text-base">批次版本: {{ currentBatch?.sourceVersion || 'N/A' }}</span>
                <Tag
                  :color="batchStatusOptions.find(o => o.value === currentBatch?.status)?.color"
                >
                  {{ batchStatusOptions.find(o => o.value === currentBatch?.status)?.label || '未知状态' }}
                </Tag>
                <Tag v-if="currentBatch?.requiresReview" color="warning">
                  需人工审查
                </Tag>
              </div>
              <div class="text-xs text-muted-foreground flex gap-4">
                <span>内容哈希: <code class="font-mono">{{ currentBatch?.contentHash?.slice(0, 10) }}...</code></span>
                <span>语义哈希: <code class="font-mono">{{ currentBatch?.semanticHash?.slice(0, 10) }}...</code></span>
                <span>创建时间: {{ currentBatch?.creationTime }}</span>
              </div>
            </div>

            <!-- 统计标签栏 -->
            <div class="flex items-center gap-3 text-sm">
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-500/10 text-green-600 font-medium">
                <span>新增</span>
                <span class="text-base font-bold">+{{ currentBatch?.addedCount ?? 0 }}</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-500/10 text-blue-600 font-medium">
                <span>修改</span>
                <span class="text-base font-bold">~{{ currentBatch?.updatedCount ?? 0 }}</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-500/10 text-red-600 font-medium">
                <span>删除</span>
                <span class="text-base font-bold">-{{ currentBatch?.removedCount ?? 0 }}</span>
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1.5 rounded bg-orange-500/10 text-orange-600 font-medium">
                <span>锁定冲突</span>
                <span class="text-base font-bold">!{{ currentBatch?.conflictCount ?? 0 }}</span>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div v-if="currentBatch?.status === SensitiveWordBatchStatus.PendingReview" class="flex items-center gap-2">
              <Button type="primary" @click="onApplyBatch">
                <template #icon><Check class="size-4" /></template>
                应用变更
              </Button>
              <Button danger @click="onIgnoreBatch">
                <template #icon><X class="size-4" /></template>
                忽略批次
              </Button>
            </div>
          </div>

          <Alert
            v-if="currentBatch?.errorMessage"
            type="error"
            class="mt-3"
            :message="currentBatch.errorMessage"
            show-icon
          />
        </Card>
      </Spin>

      <!-- 差异 Tabs 与明细列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <Tabs
            v-model:active-key="activeTab"
            class="mb-0"
            @change="handleTabChange"
          >
            <Tabs.TabPane key="all" :tab="`全部差异 (${currentBatch?.totalCount ?? 0})`" />
            <Tabs.TabPane key="added" :tab="`新增项 (${currentBatch?.addedCount ?? 0})`" />
            <Tabs.TabPane key="modified" :tab="`变更项 (${currentBatch?.updatedCount ?? 0})`" />
            <Tabs.TabPane key="deleted" :tab="`移除项 (${currentBatch?.removedCount ?? 0})`" />
            <Tabs.TabPane key="conflicts">
              <template #tab>
                <span class="flex items-center gap-1">
                  <span>锁定冲突</span>
                  <Badge
                    :count="currentBatch?.conflictCount ?? 0"
                    :number-style="{ backgroundColor: '#fa8c16' }"
                  />
                </span>
              </template>
            </Tabs.TabPane>
          </Tabs>

          <Button size="small" :loading="itemsLoading" @click="loadItems">
            <template #icon><RotateCw class="size-3.5" /></template>
            刷新明细
          </Button>
        </div>

        <Spin :spinning="itemsLoading">
          <Table
            :columns="columns"
            :data-source="itemsData"
            :pagination="{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条明细`,
            }"
            row-key="id"
            size="small"
            bordered
            @change="handleTableChange"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'word'">
                <span class="font-medium text-foreground select-all">{{ record.word }}</span>
              </template>

              <template v-else-if="column.key === 'normalizedWord'">
                <span class="font-mono text-xs text-muted-foreground">{{ record.normalizedWord }}</span>
              </template>

              <template v-else-if="column.key === 'isRegex'">
                <Tag v-if="record.isRegex" color="purple">正则</Tag>
                <span v-else class="text-xs text-muted-foreground">精准</span>
              </template>

              <template v-else-if="column.key === 'categoryChange'">
                <div class="flex items-center gap-1 text-xs">
                  <span v-if="record.oldSourceCategory" class="line-through text-muted-foreground">
                    {{ record.oldSourceCategory }}
                  </span>
                  <span v-if="record.oldSourceCategory && record.newSourceCategory">→</span>
                  <Tag color="cyan">{{ record.newSourceCategory || record.oldSourceCategory || '-' }}</Tag>
                </div>
              </template>

              <template v-else-if="column.key === 'suggestedRiskLevel'">
                <Tag :color="riskLevelOptions.find(o => o.value === record.suggestedRiskLevel)?.color">
                  {{ riskLevelOptions.find(o => o.value === record.suggestedRiskLevel)?.label || record.suggestedRiskLevel }}
                </Tag>
              </template>

              <template v-else-if="column.key === 'suggestedAction'">
                <Tag :color="actionOptions.find(o => o.value === record.suggestedAction)?.color">
                  {{ actionOptions.find(o => o.value === record.suggestedAction)?.label || record.suggestedAction }}
                </Tag>
              </template>

              <template v-else-if="column.key === 'suggestedScene'">
                <span class="text-xs text-muted-foreground">
                  {{ sceneOptions.find(o => o.value === record.suggestedScene)?.label || '全局通用' }}
                </span>
              </template>

              <template v-else-if="column.key === 'changeType'">
                <Tag :color="changeTypeOptions.find(o => o.value === record.changeType)?.color">
                  {{ changeTypeOptions.find(o => o.value === record.changeType)?.label || record.changeType }}
                </Tag>
              </template>

              <template v-else-if="column.key === 'hasConflict'">
                <Tooltip v-if="record.hasConflict" :title="record.conflictReason || '本地已锁定保护'">
                  <Tag color="orange" class="cursor-pointer">
                    已锁定保护
                  </Tag>
                </Tooltip>
                <span v-else class="text-xs text-muted-foreground">无</span>
              </template>

              <template v-else-if="column.key === 'applyStatus'">
                <Tag :color="applyStatusOptions.find(o => o.value === record.applyStatus)?.color">
                  {{ applyStatusOptions.find(o => o.value === record.applyStatus)?.label || record.applyStatus }}
                </Tag>
              </template>
            </template>

            <template #emptyText>
              <Empty description="该分类下无差异词条" />
            </template>
          </Table>
        </Spin>
      </div>
    </div>
  </Modal>
</template>
