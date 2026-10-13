<script lang="ts" setup>
import type { AssetDto, AssetFolderDto } from '#/api/cms';

import { reactive, ref } from 'vue';

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
  AssetScope,
  AssetStatus,
  AssetType,
  deleteAssetApi,
  getAssetsApi,
} from '#/api/cms';
import { copyToClipboard } from '#/utils/clipboard';

import MediaPreview from '../components/MediaPreview.vue';
import { useColumns } from './data';
import AssetMoveModal from './modules/asset-move-modal.vue';
import AssetReferenceModal from './modules/asset-reference-modal.vue';
import AssetStatusModal from './modules/asset-status-modal.vue';
import AssetThumbnailModal from './modules/asset-thumbnail-modal.vue';
import AssetUploadModal from './modules/asset-upload-modal.vue';
import FolderModal from './modules/folder-modal.vue';
import FolderTree from './modules/folder-tree.vue';

const previewAsset = ref<AssetDto>();
const previewOpen = ref(false);

const folderTreeRef = ref();
const currentScope = ref<AssetScope>(AssetScope.Private);
const currentFolderId = ref<string | undefined>(undefined);

const selectedRows = ref<AssetDto[]>([]);

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

const [ThumbnailModal, thumbnailModalApi] = useVbenModal({
  connectedComponent: AssetThumbnailModal,
  destroyOnClose: true,
});

const [ReferenceModal, referenceModalApi] = useVbenModal({
  connectedComponent: AssetReferenceModal,
  destroyOnClose: true,
});

const [StatusModal, statusModalApi] = useVbenModal({
  connectedComponent: AssetStatusModal,
  destroyOnClose: true,
});

const [FolderEditModal, folderEditModalApi] = useVbenModal({
  connectedComponent: FolderModal,
  destroyOnClose: true,
});

const [AssetMoveModalComp, assetMoveModalApi] = useVbenModal({
  connectedComponent: AssetMoveModal,
  destroyOnClose: true,
});

function onUpload() {
  uploadModalApi.setData({
    folderId: currentFolderId.value || undefined,
    scope: currentScope.value,
  });
  uploadModalApi.open();
}

function onSetThumbnail(row: AssetDto) {
  thumbnailModalApi.setData({ asset: row });
  thumbnailModalApi.open();
}

function onOpenReferences(row: AssetDto) {
  referenceModalApi.setData({ asset: row });
  referenceModalApi.open();
}

function onEditStatus(row: AssetDto) {
  statusModalApi.setData({ asset: row });
  statusModalApi.open();
}

function onMoveSingle(row: AssetDto) {
  assetMoveModalApi.setData({
    assetIds: [row.id],
    currentFolderId: row.folderId,
    scope: currentScope.value,
  });
  assetMoveModalApi.open();
}

function onBatchMove() {
  if (selectedRows.value.length === 0) {
    message.warning('请先勾选需要移动的素材');
    return;
  }
  assetMoveModalApi.setData({
    assetIds: selectedRows.value.map((r) => r.id),
    currentFolderId: currentFolderId.value || undefined,
    scope: currentScope.value,
  });
  assetMoveModalApi.open();
}

async function onCopyUrl(row: AssetDto) {
  const url = row.url;
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
    content: `确定删除素材【${row.fileName}】吗？若已被引用，系统将阻止删除以防止页面出现损坏。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除素材确认',
    async onOk() {
      try {
        await deleteAssetApi(row.id);
        message.success('素材删除成功');
        refreshGrid();
        folderTreeRef.value?.reload();
      } catch (error: any) {
        const errorMsg =
          error?.response?.data?.error?.message ||
          error?.message ||
          '删除失败，该素材可能正被文章或分类引用';
        message.error(errorMsg);
      }
    },
  });
}

function onActionClick({ code, row }: { code: string; row: AssetDto }) {
  switch (code) {
    case 'copy_url': {
      onCopyUrl(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit_status': {
      onEditStatus(row);
      break;
    }
    case 'move': {
      onMoveSingle(row);
      break;
    }
    case 'preview': {
      previewAsset.value = row;
      previewOpen.value = true;
      break;
    }
    case 'references': {
      onOpenReferences(row);
      break;
    }
    case 'set_thumbnail': {
      onSetThumbnail(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    checkboxConfig: {
      highlight: true,
      range: true,
    },
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
          let folderParam: string | undefined = undefined;
          if (currentFolderId.value === '') {
            // 空字符串代表选择未归档根目录：此处用 '00000000-0000-0000-0000-000000000000' 或后端区分
            // 但如果输入为未归档，不传 folderId 无法区分全部，所以后端在 folderId 为空 guid 或通过特殊过滤
            // 简单处理：如果当前是未归档，传 undefined 但在后端或者通过判断传空 guid
            folderParam = '00000000-0000-0000-0000-000000000000';
          } else if (currentFolderId.value) {
            folderParam = currentFolderId.value;
          }

          const result = await getAssetsApi({
            folderId: folderParam,
            includeSubFolders: true,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            scope: currentScope.value,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
            type: filters.type,
          });
          const now = Date.now();
          return {
            ...result,
            items: result.items.map((asset) => {
              const baseThumbnail = asset.thumbnailUrl;
              const thumbWithT = baseThumbnail
                ? `${baseThumbnail}${baseThumbnail.includes('?') ? '&' : '?'}_t=${now}`
                : '';
              return {
                ...asset,
                previewUrl:
                  thumbWithT ||
                  (asset.type === AssetType.Image ? asset.url : ''),
                thumbnailUrl: thumbWithT || asset.thumbnailUrl,
              };
            }),
          };
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
  gridEvents: {
    checkboxChange: () => {
      selectedRows.value = gridApi.grid?.getCheckboxRecords() || [];
    },
    checkboxAll: () => {
      selectedRows.value = gridApi.grid?.getCheckboxRecords() || [];
    },
  },
});

function refreshGrid() {
  selectedRows.value = [];
  gridApi.reload();
}

function onFolderSelect(folderId: string | undefined, scope: AssetScope) {
  currentFolderId.value = folderId;
  currentScope.value = scope;
  refreshGrid();
}

function onCreateFolder(scope: AssetScope, parentId?: string) {
  folderEditModalApi.setData({
    parentId,
    scope,
  });
  folderEditModalApi.open();
}

function onEditFolder(folder: AssetFolderDto) {
  folderEditModalApi.setData({
    record: folder,
  });
  folderEditModalApi.open();
}

function onFolderTreeSuccess() {
  folderTreeRef.value?.reload();
  refreshGrid();
}

function onThumbnailUpdated(updated: AssetDto) {
  if (previewAsset.value && previewAsset.value.id === updated.id) {
    previewAsset.value = {
      ...previewAsset.value,
      ...updated,
      thumbnailUrl: updated.thumbnailUrl
        ? `${updated.thumbnailUrl}${updated.thumbnailUrl.includes('?') ? '&' : '?'}_t=${Date.now()}`
        : updated.thumbnailUrl,
    };
  }
  refreshGrid();
}

function onFilterChange() {
  refreshGrid();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex gap-3">
      <!-- 左侧：文件夹目录树 -->
      <div class="w-[280px] shrink-0 h-full">
        <FolderTree
          ref="folderTreeRef"
          @create-folder="onCreateFolder"
          @edit-folder="onEditFolder"
          @select="onFolderSelect"
        />
      </div>

      <!-- 右侧：素材库列表与操作 -->
      <div class="flex-1 min-w-0 h-full flex flex-col gap-3">
        <!-- 搜索过滤与批量栏 -->
        <Card
          variant="borderless"
          class="shrink-0 shadow-sm"
          :styles="{ body: { padding: '12px 16px' } }"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <Input.Search
                v-model:value="filters.keyword"
                placeholder="搜索素材文件名..."
                class="w-[220px]"
                allow-clear
                @search="onFilterChange"
              />

              <RadioGroup
                v-model:value="filters.type"
                button-style="solid"
                @change="onFilterChange"
              >
                <RadioButton :value="undefined">全部</RadioButton>
                <RadioButton :value="AssetType.Image">图片</RadioButton>
                <RadioButton :value="AssetType.Video">视频</RadioButton>
                <RadioButton :value="AssetType.Audio">音频</RadioButton>
                <RadioButton :value="AssetType.File">文件</RadioButton>
              </RadioGroup>

              <Select
                v-model:value="filters.status"
                placeholder="状态筛选"
                class="w-[110px]"
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
              <Button
                v-if="selectedRows.length > 0"
                type="dashed"
                @click="onBatchMove"
              >
                批量移动 ({{ selectedRows.length }})
              </Button>
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
        <div
          class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2"
        >
          <Grid />
        </div>
      </div>
    </div>

    <!-- 弹窗挂载 -->
    <UploadModal @success="() => { refreshGrid(); folderTreeRef?.reload(); }" />
    <ThumbnailModal @success="onThumbnailUpdated" />
    <ReferenceModal @go-disable="onEditStatus" />
    <StatusModal @success="refreshGrid" />
    <FolderEditModal @success="onFolderTreeSuccess" />
    <AssetMoveModalComp @success="onFolderTreeSuccess" />
    <MediaPreview
      v-model:open="previewOpen"
      :asset="previewAsset"
      @set-thumbnail="onSetThumbnail"
    />
  </Page>
</template>
