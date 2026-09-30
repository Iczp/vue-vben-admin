<script lang="ts" setup>
import type { AssetDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Select,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AssetStatus,
  AssetType,
  deleteAssetApi,
  getAssetsApi,
} from '#/api/cms';
import { copyToClipboard } from '#/utils/clipboard';

import { useColumns } from './data';
import AssetUploadModal from './modules/asset-upload-modal.vue';

const filters = reactive<{
  keyword: string;
  status?: AssetStatus;
  type?: AssetType;
}>({
  keyword: '',
  status: undefined,
  type: undefined,
});

const [UploadModal, uploadModalApi] = useVbenModal({
  connectedComponent: AssetUploadModal,
  destroyOnClose: true,
});

function onUpload() {
  uploadModalApi.open();
}

async function onCopyUrl(row: AssetDto) {
  const url = row.sourceUrl || row.blobName;
  if (!url) {
    message.warning('该素材暂无有效链接');
    return;
  }
  try {
    await copyToClipboard(url);
    message.success('素材链接已成功复制到剪贴板');
  } catch {
    message.error('复制失败，请手动复制');
  }
}

function onDelete(row: AssetDto) {
  Modal.confirm({
    content: `确定删除素材【${row.fileName}】吗？若文章中引用了该素材可能会造成外链失效。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除素材确认',
    async onOk() {
      await deleteAssetApi(row.id);
      message.success('素材删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: AssetDto;
}) {
  switch (code) {
    case 'copy_url': {
      onCopyUrl(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [10, 15, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getAssetsApi({
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
            type: filters.type,
          });
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}

function onFilterChange() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 搜索过滤栏 -->
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索素材文件名..."
              class="w-[240px]"
              allow-clear
              @search="onFilterChange"
            />

            <RadioGroup
              v-model:value="filters.type"
              button-style="solid"
              @change="onFilterChange"
            >
              <RadioButton :value="undefined">全部类型</RadioButton>
              <RadioButton :value="AssetType.Image">图片</RadioButton>
              <RadioButton :value="AssetType.Video">视频</RadioButton>
              <RadioButton :value="AssetType.Audio">音频</RadioButton>
              <RadioButton :value="AssetType.File">文件</RadioButton>
            </RadioGroup>

            <Select
              v-model:value="filters.status"
              placeholder="状态筛选"
              class="w-[120px]"
              allow-clear
              :options="[
                { label: '正常', value: AssetStatus.Normal },
                { label: '处理中', value: AssetStatus.Processing },
                { label: '失败', value: AssetStatus.Failed },
                { label: '禁用', value: AssetStatus.Disabled },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onUpload">
              <template #icon><Plus class="size-4" /></template>
              上传素材
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 素材数据表格 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 上传弹窗挂载 -->
    <UploadModal @success="refreshGrid" />
  </Page>
</template>
