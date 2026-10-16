<script lang="ts" setup>
import type { AssetDto, AssetFolderDto } from '#/api/cms';

import { computed, markRaw, reactive, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Checkbox,
  Empty,
  Input,
  InputSearch,
  message,
  Modal,
  Pagination,
  Progress,
  RadioButton,
  RadioGroup,
  Select,
  Slider,
  Spin,
  Tabs,
  Tag,
  Upload,
  UploadDragger,
} from 'antdv-next';

import {
  AssetScope,
  AssetStatus,
  AssetType,
  ensureImageAssetThumbnails,
  getAssetApi,
  getAssetsApi,
  toRelativeAssetUrl,
  uploadAssetApi,
} from '#/api/cms';
import {
  createThumbnailFromFile,
  extractVideoFrame,
} from '#/api/cms/media-metadata';

import FolderTree from '../assets/modules/folder-tree.vue';
import {
  formatMediaDuration,
  formatMediaSize,
  mediaDimensions,
  mediaTypes,
  selectionLimit,
  toggleMediaSelection,
} from './media';
import MediaPreview from './MediaPreview.vue';

const props = withDefaults(
  defineProps<{
    assetTypes?: AssetType[];
    disabled?: boolean;
    maxCount?: number;
    multiple?: boolean;
    placeholder?: string;
    value?: string;
    values?: string[];
  }>(),
  {
    assetTypes: () => [],
    disabled: false,
    maxCount: 20,
    multiple: false,
    placeholder: '请输入或选择媒体 URL',
    value: '',
    values: () => [],
  },
);
const emit = defineEmits<{
  select: [assets: AssetDto[]];
  'update:value': [value: string];
  'update:values': [value: string[]];
}>();
const VideoIcon = markRaw(createIconifyIcon('lucide:video'));
const ImageIcon = markRaw(createIconifyIcon('lucide:image'));
const UploadIcon = markRaw(createIconifyIcon('lucide:upload-cloud'));

interface SelectorQueueItem {
  captureTime: number;
  coverMode: 'auto' | 'custom';
  errorMsg?: string;
  extracting: boolean;
  file: File;
  id: string;
  isVideo: boolean;
  result?: AssetDto;
  status: 'error' | 'extracting' | 'pending' | 'success' | 'uploading';
  thumbnailFile: File | null;
  thumbnailUrl: string;
  videoDuration: number;
}

const modelValue = computed({
  get: () => props.value,
  set: (value: string) => emit('update:value', value),
});
const limit = computed(() => selectionLimit(props.multiple, props.maxCount));
const allowedTypes = computed(() =>
  mediaTypes.filter(
    (item) =>
      props.assetTypes.length === 0 || props.assetTypes.includes(item.value),
  ),
);
const accept = computed(() =>
  props.assetTypes.length > 0 && !props.assetTypes.includes(AssetType.File)
    ? props.assetTypes
        .map(
          (type) =>
            ({
              [AssetType.Image]: 'image/*',
              [AssetType.Video]: 'video/*',
              [AssetType.Audio]: 'audio/*',
              [AssetType.File]: '',
            })[type],
        )
        .join(',')
    : undefined,
);
const isModalVisible = ref(false);
const activeTab = ref('library');
const loading = ref(false);
const uploading = ref(false);
const assetList = ref<AssetDto[]>([]);
const records = ref(new Map<string, AssetDto>());
const totalCount = ref(0);
const page = ref(1);
const pageSize = 12;
const searchKeyword = ref('');
const typeFilter = ref<AssetType>();
const selectedUrls = ref<string[]>([]);
const previewAsset = ref<AssetDto>();
const previewOpen = ref(false);
const loadError = ref(false);

// 文件夹树联动状态
const folderTreeRef = ref();
const currentScope = ref<AssetScope>(AssetScope.Private);
const currentFolderId = ref<string | undefined>(undefined);
const currentFolderPath = ref<string>('/ (全部素材)');
const includeSubFolders = ref<boolean>(true);

// 多文件上传队列状态
const uploadQueue = ref<SelectorQueueItem[]>([]);
const activeVideoItemId = ref<null | string>(null);

const activeVideoItem = computed(() =>
  uploadQueue.value.find((i) => i.id === activeVideoItemId.value),
);

const queueStats = computed(() => {
  const total = uploadQueue.value.length;
  const success = uploadQueue.value.filter(
    (i) => i.status === 'success',
  ).length;
  const error = uploadQueue.value.filter((i) => i.status === 'error').length;
  const pending = uploadQueue.value.filter(
    (i) => i.status === 'pending' || i.status === 'extracting',
  ).length;
  const percent = total > 0 ? Math.round((success / total) * 100) : 0;
  return { error, pending, percent, success, total };
});

let requestId = 0;
const committedUrls = computed(() =>
  props.multiple ? props.values : props.value ? [props.value] : [],
);
watch(
  () => [props.multiple, props.maxCount, props.assetTypes],
  () => {
    selectedUrls.value = selectedUrls.value.slice(0, limit.value);
    if (
      typeFilter.value &&
      !allowedTypes.value.some((item) => item.value === typeFilter.value)
    )
      typeFilter.value = undefined;
  },
);

watch(
  committedUrls,
  () => {
    void hydrateSelection();
  },
  { immediate: true },
);

function onFolderSelect(
  folderId: string | undefined,
  scope: AssetScope,
  _folder?: AssetFolderDto,
  fullPathText?: string,
) {
  currentFolderId.value = folderId;
  currentScope.value = scope;
  currentFolderPath.value = fullPathText || '/ (全部素材)';
  page.value = 1;
  void loadAssets();
}

async function loadAssets() {
  const id = ++requestId;
  loading.value = true;
  loadError.value = false;
  try {
    let folderParam: string | undefined;
    if (currentFolderId.value === '') {
      folderParam = '00000000-0000-0000-0000-000000000000';
    } else if (currentFolderId.value) {
      folderParam = currentFolderId.value;
    }

    const result = await getAssetsApi({
      folderId: folderParam,
      includeReferenceCount: false,
      includeSubFolders: includeSubFolders.value,
      keyword: searchKeyword.value || undefined,
      maxResultCount: pageSize,
      scope: currentScope.value,
      skipCount: (page.value - 1) * pageSize,
      status: AssetStatus.Normal,
      type:
        typeFilter.value ??
        (allowedTypes.value.length === 1
          ? allowedTypes.value[0]?.value
          : undefined),
    });
    if (id !== requestId) return;
    const reactiveItems = result.items.map((item) => reactive({ ...item }));
    assetList.value = reactiveItems;
    totalCount.value = result.totalCount;
    reactiveItems.forEach((asset) => records.value.set(asset.url, asset));

    ensureImageAssetThumbnails(reactiveItems, (assetId, thumbUrl) => {
      const target = assetList.value.find((a) => a.id === assetId);
      if (target) {
        target.thumbnailUrl = thumbUrl;
      }
    });
  } catch {
    if (id === requestId) {
      assetList.value = [];
      totalCount.value = 0;
      loadError.value = true;
    }
  } finally {
    if (id === requestId) loading.value = false;
  }
}

function openSelectorModal() {
  if (props.disabled) return;
  selectedUrls.value = [
    ...new Set(committedUrls.value.map(toRelativeAssetUrl)),
  ].slice(0, limit.value);
  typeFilter.value =
    props.assetTypes.length > 0 ? allowedTypes.value[0]?.value : undefined;
  page.value = 1;
  activeTab.value = 'library';
  uploadQueue.value = [];
  activeVideoItemId.value = null;
  isModalVisible.value = true;
  void loadAssets();
  void hydrateSelection();
}

async function hydrateSelection() {
  const urlsToHydrate = [
    ...new Set([
      ...committedUrls.value.map(toRelativeAssetUrl),
      ...selectedUrls.value.map(toRelativeAssetUrl),
    ]),
  ].filter(Boolean);

  const newlyHydrated: AssetDto[] = [];
  await Promise.allSettled(
    urlsToHydrate.map(async (url) => {
      if (records.value.has(url)) return;
      const match = new URL(url, globalThis.location.origin).pathname.match(
        /\/api\/cms\/assets\/([\da-f-]{36})\/content$/i,
      );
      if (!match?.[1]) return;
      const asset = reactive(await getAssetApi(match[1]));
      records.value.set(url, asset);
      newlyHydrated.push(asset);
    }),
  );
  if (newlyHydrated.length > 0) {
    ensureImageAssetThumbnails(newlyHydrated);
  }
}

function handleSelectAsset(asset: AssetDto) {
  const url = toRelativeAssetUrl(asset.url);
  if (!url || props.disabled) return;
  const next = toggleMediaSelection(
    selectedUrls.value,
    url,
    props.multiple,
    limit.value,
  );
  if (next === selectedUrls.value) {
    message.warning(`最多选择 ${limit.value} 个素材`);
    return;
  }
  records.value.set(url, asset);
  selectedUrls.value = next;
}

function confirmSelection() {
  if (props.disabled || uploading.value) return;
  if (selectedUrls.value.length === 0) {
    message.warning('请选择素材');
    return;
  }
  if (selectedUrls.value.length > limit.value) {
    message.warning(`最多选择 ${limit.value} 个素材`);
    return;
  }
  const relUrls = selectedUrls.value.map(toRelativeAssetUrl);
  if (props.multiple) emit('update:values', relUrls);
  else emit('update:value', relUrls[0] || '');
  emit(
    'select',
    selectedUrls.value.flatMap((url) => {
      const asset = records.value.get(url);
      return asset ? [asset] : [];
    }),
  );
  isModalVisible.value = false;
}

function removeCommitted(url: string) {
  if (props.disabled) return;
  if (props.multiple)
    emit(
      'update:values',
      props.values.filter((value) => value !== url),
    );
  else emit('update:value', '');
}

function preview(asset: AssetDto) {
  previewAsset.value = asset;
  previewOpen.value = true;
}

function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith('video/') ||
    /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.name)
  );
}

function beforeUpload(file: File) {
  if (uploading.value || props.disabled) return false;
  const type = file.type.startsWith('image/')
    ? AssetType.Image
    : isVideoFile(file)
      ? AssetType.Video
      : file.type.startsWith('audio/')
        ? AssetType.Audio
        : AssetType.File;
  if (props.assetTypes.length > 0 && !props.assetTypes.includes(type)) {
    message.warning(`文件【${file.name}】不在允许的素材类型中`);
    return false;
  }

  const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const isVid = isVideoFile(file);

  const newItem: SelectorQueueItem = {
    captureTime: 0.1,
    coverMode: 'auto',
    extracting: isVid,
    file,
    id,
    isVideo: isVid,
    status: isVid ? 'extracting' : 'pending',
    thumbnailFile: null,
    thumbnailUrl: '',
    videoDuration: 0,
  };

  uploadQueue.value.push(newItem);

  if (isVid) {
    if (!activeVideoItemId.value) {
      activeVideoItemId.value = id;
    }
    void extractQueueVideoFrame(newItem, 0.1);
  } else if (file.type.startsWith('image/')) {
    void generateSelectorImageThumbnail(newItem);
  }

  return false; // 放入队列统一上传
}

async function generateSelectorImageThumbnail(item: SelectorQueueItem) {
  const target = uploadQueue.value.find((i) => i.id === item.id);
  if (!target) return;
  try {
    const thumb = await createThumbnailFromFile(target.file, 360);
    target.thumbnailFile = thumb.file;
    target.thumbnailUrl = URL.createObjectURL(thumb.file);
  } catch {
    // 忽略缩略图生成失败
  }
}

async function extractQueueVideoFrame(
  item: SelectorQueueItem,
  timeSec: number,
) {
  const target = uploadQueue.value.find((i) => i.id === item.id);
  if (!target || !target.isVideo) return;

  target.extracting = true;
  if (target.status !== 'success' && target.status !== 'uploading') {
    target.status = 'extracting';
  }
  try {
    const res = await extractVideoFrame(target.file, timeSec);
    target.videoDuration = res.duration;
    target.thumbnailFile = res.file;
    target.thumbnailUrl = res.dataUrl;
  } catch (error) {
    console.error('视频帧提取失败', error);
  } finally {
    target.extracting = false;
    if (target.status === 'extracting') {
      target.status = 'pending';
    }
  }
}

function onStagedSliderChange(value: number) {
  const item = activeVideoItem.value;
  if (!item) return;
  item.captureTime = value;
  void extractQueueVideoFrame(item, value);
}

async function onStagedCustomCoverSelected(file: File) {
  const item = activeVideoItem.value;
  if (!item) return false;
  if (!file.type.startsWith('image/')) {
    message.error('封面必须为图片格式');
    return false;
  }
  item.extracting = true;
  try {
    const thumb = await createThumbnailFromFile(file);
    item.thumbnailFile = thumb.file;
    item.thumbnailUrl = URL.createObjectURL(thumb.file);
    message.success(`已为【${item.file.name}】应用自定义封面`);
  } catch {
    message.error('封面图片生成失败');
  } finally {
    item.extracting = false;
  }
  return false;
}

function removeQueueItem(id: string) {
  if (uploading.value) return;
  uploadQueue.value = uploadQueue.value.filter((i) => i.id !== id);
  if (activeVideoItemId.value === id) {
    activeVideoItemId.value =
      uploadQueue.value.find((i) => i.isVideo)?.id || null;
  }
}

function clearQueue() {
  if (uploading.value) return;
  uploadQueue.value = [];
  activeVideoItemId.value = null;
}

async function startSelectorQueueUpload() {
  const pendingItems = uploadQueue.value.filter(
    (i) => i.status === 'pending' || i.status === 'error',
  );
  if (pendingItems.length === 0) {
    if (uploadQueue.value.some((i) => i.status === 'extracting')) {
      message.warning('正在截取视频封面帧，请稍候...');
      return;
    }
    message.warning('请先添加待上传的文件');
    return;
  }

  uploading.value = true;
  let successCount = 0;

  for (const item of uploadQueue.value) {
    if (item.status !== 'pending' && item.status !== 'error') {
      continue;
    }

    if (item.extracting) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    item.status = 'uploading';
    item.errorMsg = undefined;

    try {
      const asset = await uploadAssetApi(
        item.file,
        item.thumbnailFile || undefined,
        currentFolderId.value || undefined,
        currentScope.value,
      );
      item.status = 'success';
      item.result = asset;
      successCount++;

      // 上传成功后自动加入选中列表（不超过上限）
      const relUrl = toRelativeAssetUrl(asset.url);
      if (relUrl) {
        records.value.set(relUrl, asset);
        if (!props.multiple) {
          selectedUrls.value = [relUrl];
        } else if (
          selectedUrls.value.length < limit.value &&
          !selectedUrls.value.includes(relUrl)
        ) {
          selectedUrls.value = [...selectedUrls.value, relUrl];
        }
      }
    } catch (error: any) {
      item.status = 'error';
      item.errorMsg =
        error?.response?.data?.error?.message || error?.message || '上传失败';
    }
  }

  uploading.value = false;

  if (successCount > 0) {
    folderTreeRef.value?.reload();
    page.value = 1;
    void loadAssets();
  }

  const failedCount = uploadQueue.value.filter(
    (i) => i.status === 'error',
  ).length;
  if (failedCount === 0 && successCount > 0) {
    message.success(`成功队列上传 ${successCount} 个文件并加入选择`);
    uploadQueue.value = [];
    activeVideoItemId.value = null;
    activeTab.value = 'library';
  } else if (successCount > 0 && failedCount > 0) {
    message.warning(`成功上传 ${successCount} 个，失败 ${failedCount} 个`);
  } else if (failedCount > 0) {
    message.error('文件上传失败，请重试');
  }
}

function filterChanged() {
  page.value = 1;
  void loadAssets();
}

defineExpose({
  openModal: openSelectorModal,
});
</script>
<template>
  <div class="w-full space-y-2">
    <div class="flex items-center gap-2">
      <Input
        v-if="!multiple"
        v-model:value="modelValue"
        :disabled="disabled"
        :placeholder="placeholder"
        allow-clear
      />
      <span v-else class="text-sm text-muted-foreground">
        已选 {{ values.length }} / {{ limit }} 个素材
      </span>
      <Button :disabled="disabled" @click="openSelectorModal">选择媒体</Button>
    </div>
    <div v-if="committedUrls.length" class="flex flex-wrap gap-2">
      <div
        v-for="url in committedUrls"
        :key="url"
        class="flex max-w-full items-center gap-2 rounded border p-2 text-xs"
      >
        <img
          v-if="records.get(toRelativeAssetUrl(url))?.thumbnailUrl"
          :src="records.get(toRelativeAssetUrl(url))?.thumbnailUrl!"
          loading="lazy"
          decoding="async"
          class="h-10 w-14 rounded bg-muted/30 object-contain"
          alt="已选缩略图"
        />
        <div
          v-else-if="
            records.get(toRelativeAssetUrl(url))?.type === AssetType.Image ||
            (!multiple && assetTypes.includes(AssetType.Image))
          "
          class="flex h-10 w-14 items-center justify-center rounded bg-muted/30 text-[10px] text-muted-foreground"
        >
          缩略图...
        </div>
        <span class="max-w-52 truncate" :title="url">{{
          records.get(toRelativeAssetUrl(url))?.fileName || url
        }}</span>
        <Button
          v-if="records.get(toRelativeAssetUrl(url))"
          type="link"
          size="small"
          @click="preview(records.get(toRelativeAssetUrl(url))!)"
        >
          预览
        </Button>
        <a
          v-else
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary"
        >
          查看
        </a>
        <Button
          :disabled="disabled"
          type="text"
          size="small"
          @click="removeCommitted(url)"
        >
          移除
        </Button>
      </div>
    </div>

    <Modal
      v-model:open="isModalVisible"
      title="媒体库选择器"
      :width="1080"
      :confirm-loading="uploading"
      :ok-button-props="{
        disabled: loading || disabled || !selectedUrls.length,
      }"
      :mask-closable="!uploading"
      :closable="!uploading"
      :cancel-button-props="{ disabled: uploading }"
      @ok="confirmSelection"
    >
      <div class="flex h-[540px] gap-3">
        <!-- 左侧复用 FolderTree 目录树组件 (is-selector 模式) -->
        <div
          class="w-[240px] shrink-0 h-full border rounded-lg overflow-hidden"
        >
          <FolderTree
            ref="folderTreeRef"
            is-selector
            @select="onFolderSelect"
          />
        </div>

        <!-- 右侧媒体库列表与上传面板 -->
        <div class="flex-1 min-w-0 h-full flex flex-col">
          <!-- 当前文件夹位置 & 显示所有子文件夹内容复选框 -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-border/60 shrink-0"
          >
            <div class="flex flex-wrap items-center gap-3">
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-muted-foreground font-medium">当前位置：</span>
                <Tag color="blue" class="!m-0 font-mono text-xs px-2 py-0.5">
                  {{ currentFolderPath }}
                </Tag>
              </div>

              <Checkbox
                v-if="currentFolderId && currentFolderId !== ''"
                v-model:checked="includeSubFolders"
                class="text-xs select-none"
                @change="filterChanged"
              >
                显示所有子文件夹内容
              </Checkbox>
            </div>

            <span class="text-xs text-muted-foreground">
              {{
                multiple ? `已选 ${selectedUrls.length} / ${limit}` : '单选模式'
              }}
            </span>
          </div>

          <Tabs
            v-model:active-key="activeTab"
            size="small"
            class="flex-1 min-h-0 flex flex-col"
          >
            <Tabs.TabPane key="library" tab="媒体库">
              <div class="mb-3 flex flex-wrap items-center gap-3">
                <InputSearch
                  v-model:value="searchKeyword"
                  placeholder="搜索文件名..."
                  class="w-64"
                  size="small"
                  allow-clear
                  @search="filterChanged"
                />
                <Select
                  v-model:value="typeFilter"
                  :options="allowedTypes"
                  :allow-clear="!assetTypes.length"
                  placeholder="全部类型"
                  size="small"
                  class="w-28"
                  @change="filterChanged"
                />
              </div>

              <div
                v-if="selectedUrls.length"
                class="mb-2 flex flex-wrap gap-1.5"
              >
                <Button
                  v-for="url in selectedUrls"
                  :key="url"
                  :disabled="disabled || uploading"
                  size="small"
                  class="!text-xs"
                  :title="url"
                  @click="
                    selectedUrls = selectedUrls.filter((item) => item !== url)
                  "
                >
                  ✓ {{ records.get(url)?.fileName || '已有素材' }} ×
                </Button>
              </div>

              <Spin :spinning="loading">
                <div v-if="loadError" class="py-8 text-center">
                  加载媒体库失败
                  <Button type="link" @click="loadAssets">重试</Button>
                </div>
                <div
                  v-else-if="assetList.length"
                  class="grid max-h-[360px] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 lg:grid-cols-4"
                >
                  <div
                    v-for="asset in assetList"
                    :key="asset.id"
                    class="overflow-hidden rounded border"
                    :class="
                      selectedUrls.includes(toRelativeAssetUrl(asset.url))
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border'
                    "
                  >
                    <button
                      type="button"
                      class="block w-full text-left"
                      :aria-pressed="
                        selectedUrls.includes(toRelativeAssetUrl(asset.url))
                      "
                      @click="handleSelectAsset(asset)"
                    >
                      <div
                        class="relative flex h-24 items-center justify-center overflow-hidden bg-muted/30 select-none"
                      >
                        <img
                          v-if="asset.thumbnailUrl"
                          :src="asset.thumbnailUrl"
                          :alt="asset.fileName"
                          loading="lazy"
                          decoding="async"
                          class="h-full w-full object-contain"
                        />
                        <span
                          v-else-if="asset.type === AssetType.Image"
                          class="text-xs text-muted-foreground"
                        >
                          缩略图...
                        </span>
                        <span v-else class="text-2xl">{{
                          asset.type === AssetType.Video
                            ? '▶'
                            : asset.type === AssetType.Audio
                              ? '♫'
                              : '▤'
                        }}</span>
                        <span
                          v-if="
                            selectedUrls.includes(toRelativeAssetUrl(asset.url))
                          "
                          class="absolute right-1 top-1 rounded bg-primary px-2 text-primary-foreground"
                        >
                          ✓
                        </span>
                      </div>
                      <div class="space-y-1 p-2 text-xs">
                        <div
                          class="truncate font-medium"
                          :title="asset.fileName"
                        >
                          {{ asset.fileName }}
                        </div>
                        <div>
                          {{
                            mediaTypes.find((item) => item.value === asset.type)
                              ?.label
                          }}
                          · {{ formatMediaSize(asset.fileSize) }}
                        </div>
                        <div
                          v-if="
                            asset.type === AssetType.Image ||
                            asset.type === AssetType.Video
                          "
                        >
                          {{ mediaDimensions(asset) }}
                        </div>
                        <div
                          v-if="
                            asset.type === AssetType.Video ||
                            asset.type === AssetType.Audio
                          "
                        >
                          时长 {{ formatMediaDuration(asset.duration) }}
                        </div>
                      </div>
                    </button>
                    <Button
                      type="link"
                      size="small"
                      class="mb-1 !text-xs"
                      @click="preview(asset)"
                    >
                      预览 / 详情
                    </Button>
                  </div>
                </div>
                <Empty
                  v-else
                  description="当前目录下暂无符合条件的素材"
                  class="py-8"
                />
                <Pagination
                  v-if="totalCount > pageSize"
                  v-model:current="page"
                  :page-size="pageSize"
                  :total="totalCount"
                  :show-size-changer="false"
                  class="mt-3"
                  size="small"
                  @change="loadAssets"
                />
              </Spin>
            </Tabs.TabPane>

            <Tabs.TabPane key="upload" tab="批量队列上传">
              <div class="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                <div
                  class="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <div>
                    上传目标目录：<Tag
                      color="blue"
                      class="!m-0 font-mono text-xs"
                      >
{{ currentFolderPath }}
</Tag>
                  </div>
                  <div
                    v-if="uploadQueue.length > 0"
                    class="flex items-center gap-2"
                  >
                    <Button
                      v-if="!uploading"
                      size="small"
                      type="text"
                      danger
                      @click="clearQueue"
                    >
                      清空队列
                    </Button>
                    <Button
                      type="primary"
                      size="small"
                      :loading="uploading"
                      :disabled="
                        queueStats.pending === 0 && queueStats.error === 0
                      "
                      @click="startSelectorQueueUpload"
                    >
                      开始队列上传 ({{ queueStats.pending + queueStats.error }})
                    </Button>
                  </div>
                </div>

                <!-- 多文件拖拽区 -->
                <UploadDragger
                  :disabled="uploading || disabled"
                  :multiple="true"
                  :accept="accept"
                  :before-upload="beforeUpload"
                  :show-upload-list="false"
                >
                  <p class="flex justify-center py-1">
                    <UploadIcon class="size-8 text-primary" />
                  </p>
                  <p class="text-sm font-medium">
                    点击或将多个文件拖拽至此区域加入队列
                  </p>
                  <p class="pb-1 text-xs text-muted-foreground">
                    支持一次选择多个文件排队上传，上传完成后自动归档至当前选中目录并加入已选列表。
                  </p>
                </UploadDragger>

                <!-- 队列列表 -->
                <div v-if="uploadQueue.length > 0" class="space-y-2">
                  <Progress
                    v-if="uploading || queueStats.success > 0"
                    :percent="queueStats.percent"
                    size="small"
                  />

                  <div
                    class="max-h-[160px] overflow-y-auto border rounded divide-y bg-muted/10"
                  >
                    <div
                      v-for="(item, idx) in uploadQueue"
                      :key="item.id"
                      class="flex items-center justify-between px-3 py-1.5 text-xs"
                    >
                      <div class="flex items-center gap-2 min-w-0 flex-1">
                        <span
                          class="text-muted-foreground font-mono w-5 shrink-0"
                        >
                          #{{ idx + 1 }}
                        </span>
                        <div
                          class="w-8 h-6 rounded border bg-black/80 overflow-hidden flex items-center justify-center shrink-0"
                        >
                          <img
                            v-if="item.thumbnailUrl"
                            :src="item.thumbnailUrl"
                            class="w-full h-full object-cover"
                            alt=""
                          />
                          <VideoIcon
                            v-else-if="item.isVideo"
                            class="size-3.5 text-white"
                          />
                          <ImageIcon v-else class="size-3.5 text-white/70" />
                        </div>
                        <span
                          class="truncate font-medium"
                          :title="item.file.name"
                        >
                          {{ item.file.name }}
                        </span>
                        <span class="text-muted-foreground shrink-0">
                          ({{ (item.file.size / 1024 / 1024).toFixed(2) }} MB)
                        </span>
                      </div>

                      <div class="flex items-center gap-1.5 shrink-0 ml-2">
                        <Button
                          v-if="item.isVideo && item.status !== 'success'"
                          size="small"
                          :type="
                            activeVideoItemId === item.id ? 'primary' : 'dashed'
                          "
                          ghost
                          class="!text-xs !px-1.5 !h-5"
                          @click="
                            activeVideoItemId =
                              activeVideoItemId === item.id ? null : item.id
                          "
                        >
                          🎞️ 封面
                        </Button>
                        <Tag
                          v-if="item.status === 'extracting'"
                          color="orange"
                          class="!m-0"
                        >
                          提取帧
                        </Tag>
                        <Tag
                          v-else-if="item.status === 'pending'"
                          color="default"
                          class="!m-0"
                        >
                          排队中
                        </Tag>
                        <Tag
                          v-else-if="item.status === 'uploading'"
                          color="processing"
                          class="!m-0"
                        >
                          上传中
                        </Tag>
                        <Tag
                          v-else-if="item.status === 'success'"
                          color="success"
                          class="!m-0"
                        >
                          ✓ 完成
                        </Tag>
                        <Tag
                          v-else-if="item.status === 'error'"
                          color="error"
                          class="!m-0"
                        >
                          失败
                        </Tag>
                        <Button
                          v-if="!uploading && item.status !== 'success'"
                          type="text"
                          danger
                          size="small"
                          class="!px-1 !h-5"
                          @click="removeQueueItem(item.id)"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  </div>

                  <!-- 视频封面定制折叠区 -->
                  <div
                    v-if="activeVideoItem"
                    class="border rounded p-2.5 bg-background space-y-2"
                  >
                    <div
                      class="flex items-center justify-between border-b pb-1.5"
                    >
                      <span class="font-medium text-xs truncate">
                        🎬 视频封面：{{ activeVideoItem.file.name }}
                      </span>
                      <RadioGroup
                        v-model:value="activeVideoItem.coverMode"
                        size="small"
                        button-style="solid"
                      >
                        <RadioButton value="auto">截取视频帧</RadioButton>
                        <RadioButton value="custom">自定义图片</RadioButton>
                      </RadioGroup>
                    </div>
                    <Spin :spinning="activeVideoItem.extracting">
                      <div class="flex gap-3 items-start">
                        <div
                          class="w-[120px] h-[72px] border rounded bg-black/90 overflow-hidden flex items-center justify-center shrink-0"
                        >
                          <img
                            v-if="activeVideoItem.thumbnailUrl"
                            :src="activeVideoItem.thumbnailUrl"
                            class="max-w-full max-h-full object-contain"
                            alt=""
                          />
                        </div>
                        <div
                          v-if="activeVideoItem.coverMode === 'auto'"
                          class="flex-1 min-w-0"
                        >
                          <Slider
                            v-model:value="activeVideoItem.captureTime"
                            :min="0"
                            :max="
                              activeVideoItem.videoDuration > 0
                                ? Number(
                                    activeVideoItem.videoDuration.toFixed(1),
                                  )
                                : 10
                            "
                            :step="0.5"
                            @after-change="onStagedSliderChange"
                          />
                          <div class="text-xs text-muted-foreground">
                            截取点: {{ activeVideoItem.captureTime }} 秒
                          </div>
                        </div>
                        <div v-else class="flex-1">
                          <Upload
                            :show-upload-list="false"
                            accept="image/*"
                            :before-upload="onStagedCustomCoverSelected"
                          >
                            <Button size="small">选择封面图片</Button>
                          </Upload>
                        </div>
                      </div>
                    </Spin>
                  </div>
                </div>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </div>
    </Modal>
    <MediaPreview v-model:open="previewOpen" :asset="previewAsset" />
  </div>
</template>
