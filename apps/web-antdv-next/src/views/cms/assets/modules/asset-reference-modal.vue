<script setup lang="ts">
import type { AssetDto, AssetReferenceDto } from '#/api/cms';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { useVbenModal } from '@vben/common-ui';
import { ExternalLink } from '@vben/icons';

import { Alert, Button, Empty, Spin, Table, Tag } from 'antdv-next';

import { getAssetReferencesApi } from '#/api/cms';

const emit = defineEmits<{
  'go-disable': [asset: AssetDto];
}>();

const router = useRouter();
const currentAsset = ref<AssetDto | null>(null);
const loading = ref(false);
const referenceList = ref<AssetReferenceDto[]>([]);

const columns = [
  {
    dataIndex: 'targetType',
    key: 'targetType',
    title: '引用类型',
    width: 120,
  },
  {
    dataIndex: 'targetTitle',
    key: 'targetTitle',
    title: '引用目标名称 / 标题',
    minWidth: 220,
  },
  {
    dataIndex: 'referenceTime',
    key: 'referenceTime',
    title: '引用 / 创建时间',
    width: 170,
  },
  {
    key: 'action',
    title: '操作',
    width: 110,
  },
];

async function loadReferences(id: string) {
  loading.value = true;
  try {
    referenceList.value = await getAssetReferencesApi(id);
  } catch (error) {
    console.error('获取素材引用失败', error);
    referenceList.value = [];
  } finally {
    loading.value = false;
  }
}

function handleGoTarget(record: AssetReferenceDto) {
  if (record.targetUrl) {
    modalApi.close();
    void router.push(record.targetUrl);
  }
}

function handleDisableAsset() {
  if (currentAsset.value) {
    modalApi.close();
    emit('go-disable', currentAsset.value);
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as undefined | { asset?: AssetDto };
      if (data?.asset) {
        currentAsset.value = data.asset;
        referenceList.value = [];
        void loadReferences(data.asset.id);
      }
    }
  },
  title: '素材引用关系查询',
});
</script>

<template>
  <Modal class="w-[750px] max-w-full">
    <div v-if="currentAsset" class="py-2 space-y-4">
      <!-- 顶部素材信息摘要与防护提示 -->
      <Alert
        v-if="referenceList.length > 0"
        type="warning"
        show-icon
        class="border"
      >
        <template #message>
          <span class="font-medium">
            该素材已被引用
            {{ referenceList.length }} 次，系统已开启引用保护，无法直接删除！
          </span>
        </template>
        <template #description>
          <div
            class="text-xs mt-1 text-muted-foreground flex items-center justify-between"
          >
            <span>如确需停止展示该素材，可将素材状态变更为【已禁用】，禁用后外部不可访问。</span>
            <Button
              size="small"
              type="primary"
              danger
              ghost
              @click="handleDisableAsset"
            >
              去禁用此素材
            </Button>
          </div>
        </template>
      </Alert>

      <Alert
        v-else-if="!loading"
        type="success"
        show-icon
        message="当前暂无其他栏目或文章引用此素材"
        description="该素材处于未引用状态，可以安全进行删除或维护。"
      />

      <!-- 素材基本信息条 -->
      <div
        class="flex items-center justify-between p-3 border rounded bg-muted/20 text-xs"
      >
        <div class="flex items-center gap-3 truncate">
          <span
            class="font-medium text-sm text-foreground truncate"
            :title="currentAsset.fileName"
          >
            {{ currentAsset.fileName }}
          </span>
          <Tag color="cyan">
            {{ currentAsset.extension || currentAsset.mimeType }}
          </Tag>
        </div>
        <span class="text-muted-foreground shrink-0">ID: {{ currentAsset.id }}</span>
      </div>

      <!-- 引用列表表格 -->
      <Spin :spinning="loading">
        <div class="border rounded overflow-hidden">
          <Table
            :data-source="referenceList"
            :columns="columns"
            :pagination="false"
            row-key="targetId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'targetType'">
                <Tag
                  :color="
                    record.targetType.includes('封面')
                      ? 'blue'
                      : record.targetType.includes('正文')
                        ? 'purple'
                        : 'default'
                  "
                >
                  {{ record.targetType }}
                </Tag>
              </template>

              <template v-else-if="column.key === 'targetTitle'">
                <span class="font-medium text-sm">{{
                  record.targetTitle
                }}</span>
              </template>

              <template v-else-if="column.key === 'referenceTime'">
                <span class="text-xs text-muted-foreground">
                  {{
                    record.referenceTime
                      ? new Date(record.referenceTime).toLocaleString()
                      : '—'
                  }}
                </span>
              </template>

              <template v-else-if="column.key === 'action'">
                <Button
                  v-if="record.targetUrl"
                  type="link"
                  size="small"
                  class="p-0 flex items-center gap-1"
                  @click="handleGoTarget(record)"
                >
                  <span>查看目标</span>
                  <ExternalLink class="size-3" />
                </Button>
                <span v-else class="text-xs text-muted-foreground">—</span>
              </template>
            </template>

            <template #emptyText>
              <Empty description="暂无关联引用记录" class="py-6" />
            </template>
          </Table>
        </div>
      </Spin>

      <!-- 底部关闭按钮 -->
      <div class="flex justify-end pt-2">
        <Button @click="modalApi.close()">关闭</Button>
      </div>
    </div>
  </Modal>
</template>
