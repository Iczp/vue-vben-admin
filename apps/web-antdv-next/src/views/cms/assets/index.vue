<script lang="ts" setup>
import type { AssetDto, AssetFolderDto } from '#/api/cms';

import { computed, reactive, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Checkbox,
  Dropdown,
  Empty,
  Input,
  Menu,
  MenuItem,
  message,
  Modal,
  Pagination,
  RadioButton,
  RadioGroup,
  Select,
  Spin,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  AssetScope,
  AssetStatus,
  AssetType,
  batchDeleteAssetsApi,
  deleteAssetApi,
  ensureImageAssetThumbnails,
  getAssetsApi,
  renameAssetApi,
} from '#/api/cms';
import { copyToClipboard } from '#/utils/clipboard';

import {
  formatMediaDuration,
  formatMediaSize,
  mediaDimensions,
} from '../components/media';
import MediaPreview from '../components/MediaPreview.vue';
import { assetStatusOptions, assetTypeOptions, useColumns } from './data';
import AssetMoveModal from './modules/asset-move-modal.vue';
import AssetReferenceModal from './modules/asset-reference-modal.vue';
import AssetStatusModal from './modules/asset-status-modal.vue';
import AssetThumbnailModal from './modules/asset-thumbnail-modal.vue';
import AssetUploadModal from './modules/asset-upload-modal.vue';
import FolderModal from './modules/folder-modal.vue';
import FolderTree from './modules/folder-tree.vue';

const previewAsset = ref<AssetDto>();
const previewOpen = ref(false);
const thumbnailVersionMap = reactive<Record<string, number>>({});

// 视图模式：table (表格视图) | grid (网格卡片视图)
const viewMode = ref<'grid' | 'table'>('table');
const gridItems = ref<AssetDto[]>([]);
const gridTotal = ref(0);
const gridLoading = ref(false);
const gridPage = ref(1);
const gridPageSize = ref(18);

// 重命名弹窗状态
const renameModalOpen = ref(false);
const renameLoading = ref(false);
const renameTarget = ref<AssetDto | null>(null);
const renameValue = ref('');

const folderTreeRef = ref();
const currentScope = ref<AssetScope>(AssetScope.Private);
const currentFolderId = ref<string | undefined>(undefined);
const currentFolderRecord = ref<AssetFolderDto | undefined>(undefined);
const currentFolderPath = ref<string>('/ (全部素材)');
const includeSubFolders = ref<boolean>(true);

const selectedRows = ref<AssetDto[]>([]);
const selectedIdsSet = computed(
  () => new Set(selectedRows.value.map((r) => r.id)),
);

const isAllGridSelected = computed(
  () =>
    gridItems.value.length > 0 &&
    gridItems.value.every((item) => selectedIdsSet.value.has(item.id)),
);

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

function onOpenRename(row: AssetDto) {
  renameTarget.value = row;
  renameValue.value = row.fileName || '';
  renameModalOpen.value = true;
}

async function handleConfirmRename() {
  if (!renameTarget.value) return;
  const trimmed = renameValue.value.trim();
  if (!trimmed) {
    message.warning('请输入新的素材文件名');
    return;
  }
  renameLoading.value = true;
  try {
    await renameAssetApi(renameTarget.value.id, { fileName: trimmed });
    message.success('素材重命名成功');
    renameModalOpen.value = false;
    refreshGrid();
  } catch (error: any) {
    const msg =
      error?.response?.data?.error?.message || error?.message || '重命名失败';
    message.error(msg);
  } finally {
    renameLoading.value = false;
  }
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

function onBatchDelete() {
  if (selectedRows.value.length === 0) {
    message.warning('请先勾选需要删除的素材');
    return;
  }
  const count = selectedRows.value.length;
  Modal.confirm({
    content: `确定批量删除已勾选的 ${count} 个素材吗？正在被文章或分类引用的素材将自动跳过以确保安全。`,
    okText: '确认批量删除',
    okType: 'danger',
    title: '批量删除素材确认',
    async onOk() {
      try {
        const res = await batchDeleteAssetsApi({
          assetIds: selectedRows.value.map((r) => r.id),
        });
        if (res.skippedCount === 0) {
          message.success(`成功删除 ${res.deletedCount} 个素材`);
        } else {
          const names = res.skippedFileNames.slice(0, 3).join('、');
          const suffix = res.skippedFileNames.length > 3 ? ' 等' : '';
          message.warning(
            `已删除 ${res.deletedCount} 个素材；自动跳过 ${res.skippedCount} 个正被引用的素材（${names}${suffix}）`,
          );
        }
        refreshGrid();
        folderTreeRef.value?.reload();
      } catch (error: any) {
        const msg =
          error?.response?.data?.error?.message ||
          error?.message ||
          '批量删除失败';
        message.error(msg);
      }
    },
  });
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
    case 'rename': {
      onOpenRename(row);
      break;
    }
    case 'set_thumbnail': {
      onSetThumbnail(row);
      break;
    }
  }
}

function resolveFolderParam(): string | undefined {
  if (currentFolderId.value === '') {
    return '00000000-0000-0000-0000-000000000000';
  }
  if (currentFolderId.value) {
    return currentFolderId.value;
  }
  return undefined;
}

function enrichAssetRows(items: AssetDto[]) {
  const mappedItems = items.map((asset) => {
    const baseThumbnail = asset.thumbnailUrl;
    const ver = thumbnailVersionMap[asset.id];
    const finalThumb =
      baseThumbnail && ver
        ? `${baseThumbnail}${baseThumbnail.includes('?') ? '&' : '?'}_t=${ver}`
        : baseThumbnail || '';
    return reactive({
      ...asset,
      // 仅使用缩略图渲染列表，绝不直接绑定大图 asset.url
      previewUrl: finalThumb,
      thumbnailUrl: finalThumb || null,
    });
  });

  // 对历史未生成缩略图的图片，后台自动生成 360px 缩略图并回写
  ensureImageAssetThumbnails(mappedItems, (assetId, thumbUrl) => {
    const row = mappedItems.find((item) => item.id === assetId);
    if (row) {
      row.thumbnailUrl = thumbUrl;
      row.previewUrl = thumbUrl;
    }
  });

  return mappedItems;
}

async function loadGridViewData() {
  gridLoading.value = true;
  try {
    const result = await getAssetsApi({
      folderId: resolveFolderParam(),
      includeSubFolders: includeSubFolders.value,
      keyword: filters.keyword.trim() || undefined,
      maxResultCount: gridPageSize.value,
      scope: currentScope.value,
      skipCount: (gridPage.value - 1) * gridPageSize.value,
      status: filters.status,
      type: filters.type,
    });
    gridItems.value = enrichAssetRows(result.items);
    gridTotal.value = result.totalCount;
  } finally {
    gridLoading.value = false;
  }
}

function toggleGridItemSelection(item: AssetDto) {
  const idx = selectedRows.value.findIndex((r) => r.id === item.id);
  if (idx >= 0) {
    selectedRows.value.splice(idx, 1);
  } else {
    selectedRows.value.push(item);
  }
}

function toggleSelectAllGrid(checked: boolean) {
  if (checked) {
    const existingIds = new Set(selectedRows.value.map((r) => r.id));
    for (const item of gridItems.value) {
      if (!existingIds.has(item.id)) {
        selectedRows.value.push(item);
      }
    }
  } else {
    const pageIds = new Set(gridItems.value.map((r) => r.id));
    selectedRows.value = selectedRows.value.filter((r) => !pageIds.has(r.id));
  }
}

function onViewModeChange() {
  selectedRows.value = [];
  if (viewMode.value === 'grid') {
    gridPage.value = 1;
    void loadGridViewData();
  } else {
    gridApi.reload();
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
          const result = await getAssetsApi({
            folderId: resolveFolderParam(),
            includeSubFolders: includeSubFolders.value,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            scope: currentScope.value,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
            type: filters.type,
          });
          const mappedItems = enrichAssetRows(result.items);
          return {
            ...result,
            items: mappedItems,
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
  if (viewMode.value === 'grid') {
    void loadGridViewData();
  } else {
    gridApi.reload();
  }
}

function onFolderSelect(
  folderId: string | undefined,
  scope: AssetScope,
  folder?: AssetFolderDto,
  fullPathText?: string,
) {
  currentFolderId.value = folderId;
  currentScope.value = scope;
  currentFolderRecord.value = folder;
  currentFolderPath.value = fullPathText || '/ (全部素材)';
  gridPage.value = 1;
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

function onDeleteCurrentFolderDirect() {
  if (currentFolderRecord.value) {
    folderTreeRef.value?.deleteFolder(currentFolderRecord.value);
  }
}

function onDeleteCurrentFolderAndMove() {
  if (currentFolderRecord.value) {
    folderTreeRef.value?.deleteFolderAndMove(currentFolderRecord.value);
  }
}

function onFolderTreeSuccess() {
  folderTreeRef.value?.reload();
  refreshGrid();
}

function onThumbnailUpdated(updated: AssetDto) {
  const now = Date.now();
  thumbnailVersionMap[updated.id] = now;
  if (previewAsset.value && previewAsset.value.id === updated.id) {
    previewAsset.value = {
      ...previewAsset.value,
      ...updated,
      thumbnailUrl: updated.thumbnailUrl
        ? `${updated.thumbnailUrl}${updated.thumbnailUrl.includes('?') ? '&' : '?'}_t=${now}`
        : updated.thumbnailUrl,
    };
  }
  refreshGrid();
}

function onFilterChange() {
  gridPage.value = 1;
  refreshGrid();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex gap-3">
      <!-- 左侧：文件夹目录树 -->
      <div class="w-[290px] shrink-0 h-full">
        <FolderTree
          ref="folderTreeRef"
          @create-folder="onCreateFolder"
          @edit-folder="onEditFolder"
          @select="onFolderSelect"
        />
      </div>

      <!-- 右侧：素材库列表与操作 -->
      <div class="flex-1 min-w-0 h-full flex flex-col gap-3">
        <!-- 当前文件夹位置 & 滤镜与操作栏 -->
        <Card
          variant="borderless"
          class="shrink-0 shadow-sm"
          :styles="{ body: { padding: '12px 16px' } }"
        >
          <!-- 第一行：当前文件夹位置 + 包含子目录复选框 + 当前文件夹快捷操作 -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-border/60"
          >
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex items-center gap-1.5 text-sm">
                <span class="text-muted-foreground font-medium">当前位置：</span>
                <Tag color="blue" class="!m-0 font-mono text-xs px-2 py-0.5">
                  {{ currentFolderPath }}
                </Tag>
              </div>

              <Checkbox
                v-if="currentFolderId && currentFolderId !== ''"
                v-model:checked="includeSubFolders"
                class="text-xs select-none"
                @change="onFilterChange"
              >
                显示所有子文件夹内容
              </Checkbox>
            </div>

            <!-- 当选中具体自定义文件夹时，显式展示文件夹管理按钮 -->
            <div
              v-if="currentFolderRecord"
              class="flex items-center gap-1.5"
            >
              <Button
                size="small"
                type="dashed"
                @click="onCreateFolder(currentScope, currentFolderRecord.id)"
              >
                ➕ 新建子文件夹
              </Button>
              <Button
                size="small"
                @click="onEditFolder(currentFolderRecord)"
              >
                ✏️ 编辑/移动文件夹
              </Button>
              <Dropdown :trigger="['click']">
                <Button size="small" danger>
                  🗑️ 删除文件夹
                </Button>
                <template #overlay>
                  <Menu>
                    <MenuItem
                      key="del"
                      danger
                      @click="onDeleteCurrentFolderDirect"
                    >
                      🗑️ 直接删除空文件夹
                    </MenuItem>
                    <MenuItem
                      key="del_move"
                      danger
                      @click="onDeleteCurrentFolderAndMove"
                    >
                      📦 删除并将素材移至父级
                    </MenuItem>
                  </Menu>
                </template>
              </Dropdown>
            </div>
          </div>

          <!-- 第二行：搜索过滤与素材操作 -->
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-3">
              <Input.Search
                v-model:value="filters.keyword"
                placeholder="搜索素材文件名..."
                class="w-[210px]"
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
                class="w-[105px]"
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

            <div class="flex flex-wrap items-center gap-2">
              <RadioGroup
                v-model:value="viewMode"
                button-style="solid"
                @change="onViewModeChange"
              >
                <RadioButton value="table">📋 列表</RadioButton>
                <RadioButton value="grid">🖼️ 网格</RadioButton>
              </RadioGroup>

              <Button
                v-if="selectedRows.length > 0"
                type="dashed"
                @click="onBatchMove"
              >
                批量移动 ({{ selectedRows.length }})
              </Button>
              <Button
                v-if="selectedRows.length > 0"
                danger
                type="dashed"
                @click="onBatchDelete"
              >
                批量删除 ({{ selectedRows.length }})
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

        <!-- 素材数据展示区：表格视图 或 网格卡片视图 -->
        <div
          class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2 flex flex-col"
        >
          <!-- 1. 表格视图 -->
          <div v-if="viewMode === 'table'" class="flex-1 min-h-0">
            <Grid />
          </div>

          <!-- 2. 网格卡片视图 -->
          <div v-else class="flex-1 min-h-0 flex flex-col">
            <div
              class="flex items-center justify-between px-2 py-1.5 border-b border-border/50 text-xs text-muted-foreground shrink-0"
            >
              <Checkbox
                :checked="isAllGridSelected"
                @change="(e: any) => toggleSelectAllGrid(e.target.checked)"
              >
                全选当页 ({{ selectedRows.length }} 已选)
              </Checkbox>
              <span>共 {{ gridTotal }} 个素材</span>
            </div>

            <Spin :spinning="gridLoading" class="flex-1 min-h-0">
              <div
                v-if="gridItems.length > 0"
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto p-2 max-h-[calc(100vh-300px)]"
              >
                <div
                  v-for="item in gridItems"
                  :key="item.id"
                  class="group relative flex flex-col rounded-lg border transition-all overflow-hidden bg-card hover:shadow-md"
                  :class="
                    selectedIdsSet.has(item.id)
                      ? 'border-primary ring-2 ring-primary/25'
                      : 'border-border'
                  "
                >
                  <!-- 顶部缩略图区域 -->
                  <div
                    class="relative h-32 w-full bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer select-none"
                    @click="
                      () => {
                        previewAsset = item;
                        previewOpen = true;
                      }
                    "
                  >
                    <img
                      v-if="item.thumbnailUrl"
                      :src="item.thumbnailUrl"
                      :alt="item.fileName"
                      loading="lazy"
                      decoding="async"
                      class="h-full w-full object-contain"
                    />
                    <span
                      v-else-if="item.type === AssetType.Image"
                      class="text-xs text-muted-foreground"
                    >
                      缩略图...
                    </span>
                    <span v-else class="text-3xl text-muted-foreground">
                      {{
                        item.type === AssetType.Video
                          ? '🎬'
                          : item.type === AssetType.Audio
                            ? '🎵'
                            : '📄'
                      }}
                    </span>

                    <!-- 左上角多选框 -->
                    <div
                      class="absolute left-2 top-2 z-10 bg-background/85 rounded px-1 py-0.5 shadow-sm"
                      @click.stop
                    >
                      <Checkbox
                        :checked="selectedIdsSet.has(item.id)"
                        @change="toggleGridItemSelection(item)"
                      />
                    </div>

                    <!-- 右上角类型与状态 -->
                    <div class="absolute right-1.5 top-1.5 flex items-center gap-1">
                      <Tag
                        :color="
                          assetTypeOptions.find((o) => o.value === item.type)
                            ?.color
                        "
                        class="!m-0 !text-[10px] !px-1.5 !leading-4"
                      >
                        {{
                          assetTypeOptions.find((o) => o.value === item.type)
                            ?.label
                        }}
                      </Tag>
                    </div>
                  </div>

                  <!-- 卡片信息区 -->
                  <div class="p-2 flex-1 flex flex-col justify-between text-xs space-y-1">
                    <div>
                      <div
                        class="font-medium truncate text-foreground"
                        :title="item.fileName"
                      >
                        {{ item.fileName }}
                      </div>
                      <div class="text-[11px] text-muted-foreground flex items-center justify-between mt-0.5">
                        <span>{{ formatMediaSize(item.fileSize) }}</span>
                        <span
                          v-if="
                            item.type === AssetType.Image ||
                            item.type === AssetType.Video
                          "
                        >
                          {{ mediaDimensions(item) }}
                        </span>
                        <span
                          v-else-if="item.type === AssetType.Audio"
                        >
                          {{ formatMediaDuration(item.duration) }}
                        </span>
                      </div>
                    </div>

                    <div class="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                      <a
                        class="text-primary hover:underline cursor-pointer"
                        @click="onOpenReferences(item)"
                      >
                        引用 {{ item.referenceCount ?? 0 }} 次
                      </a>
                      <span class="text-muted-foreground truncate max-w-[90px]" :title="item.folderName || '未归档'">
                        📁 {{ item.folderName || '未归档' }}
                      </span>
                    </div>

                    <!-- 底部快捷操作栏 -->
                    <div class="flex items-center justify-between pt-1 border-t border-border/50">
                      <Button
                        size="small"
                        type="link"
                        class="!px-1 !text-xs"
                        @click="onOpenRename(item)"
                      >
                        重命名
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        class="!px-1 !text-xs"
                        @click="onMoveSingle(item)"
                      >
                        移动
                      </Button>
                      <Button
                        v-if="item.type === AssetType.Video"
                        size="small"
                        type="link"
                        class="!px-1 !text-xs"
                        @click="onSetThumbnail(item)"
                      >
                        封面
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        danger
                        class="!px-1 !text-xs"
                        @click="onDelete(item)"
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <Empty
                v-else
                description="当前条件下暂无素材"
                class="py-16"
              />
            </Spin>

            <div class="flex justify-end pt-2 px-2 border-t border-border/50 shrink-0">
              <Pagination
                v-model:current="gridPage"
                v-model:page-size="gridPageSize"
                :total="gridTotal"
                :page-size-options="['12', '18', '36', '60']"
                show-size-changer
                size="small"
                @change="loadGridViewData"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 重命名素材弹窗 -->
    <Modal
      v-model:open="renameModalOpen"
      title="重命名素材"
      :confirm-loading="renameLoading"
      :width="440"
      @ok="handleConfirmRename"
    >
      <div class="py-3 space-y-2">
        <div class="text-xs text-muted-foreground">
          仅修改素材的逻辑显示文件名（自动保留原文件扩展名），不会影响已有文章或链接的正常访问。
        </div>
        <Input
          v-model:value="renameValue"
          placeholder="请输入新的素材名称"
          :maxlength="200"
          allow-clear
          @press-enter="handleConfirmRename"
        />
      </div>
    </Modal>

    <!-- 弹窗挂载 -->
    <UploadModal
      @success="
        () => {
          refreshGrid();
          folderTreeRef?.reload();
        }
      "
    />
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
