<script lang="ts" setup>
import type { AssetDto } from '#/api/cms';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Empty,
  Input,
  InputSearch,
  message,
  Modal,
  Pagination,
  Select,
  Spin,
  Tabs,
  UploadDragger,
} from 'antdv-next';

import {
  AssetStatus,
  AssetType,
  getAssetApi,
  getAssetsApi,
  toRelativeAssetUrl,
  uploadAssetApi,
} from '#/api/cms';

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
const modelValue = computed({
  get: () => props.value,
  set: (value: string) => emit('update:value', value),
});
const limit = computed(() => selectionLimit(props.multiple, props.maxCount));
const allowedTypes = computed(() =>
  mediaTypes.filter(
    (item) => !props.assetTypes.length || props.assetTypes.includes(item.value),
  ),
);
const accept = computed(() =>
  props.assetTypes.length && !props.assetTypes.includes(AssetType.File)
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
async function loadAssets() {
  const id = ++requestId;
  loading.value = true;
  loadError.value = false;
  try {
    const result = await getAssetsApi({
      keyword: searchKeyword.value || undefined,
      maxResultCount: pageSize,
      skipCount: (page.value - 1) * pageSize,
      status: AssetStatus.Normal,
      type:
        typeFilter.value ??
        (allowedTypes.value.length === 1
          ? allowedTypes.value[0]?.value
          : undefined),
    });
    if (id !== requestId) return;
    // The API supports one type at a time; restricted callers start with a concrete allowed type.
    assetList.value = result.items;
    totalCount.value = result.totalCount;
    result.items.forEach((asset) => records.value.set(asset.url, asset));
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
  typeFilter.value = props.assetTypes.length
    ? allowedTypes.value[0]?.value
    : undefined;
  page.value = 1;
  activeTab.value = 'library';
  isModalVisible.value = true;
  void loadAssets();
  void hydrateSelection();
}
async function hydrateSelection() {
  await Promise.allSettled(
    selectedUrls.value.map(async (url) => {
      if (records.value.has(url)) return;
      const match = new URL(url, globalThis.location.origin).pathname.match(
        /\/api\/cms\/assets\/([\da-f-]{36})\/content$/i,
      );
      if (!match?.[1]) return;
      const asset = await getAssetApi(match[1]);
      records.value.set(url, asset);
    }),
  );
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
  if (!selectedUrls.value.length) {
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
function beforeUpload(file: File) {
  if (uploading.value || props.disabled) return false;
  if (props.multiple && selectedUrls.value.length >= limit.value) {
    message.warning(`最多选择 ${limit.value} 个素材`);
    return false;
  }
  const type = file.type.startsWith('image/')
    ? AssetType.Image
    : file.type.startsWith('video/')
      ? AssetType.Video
      : file.type.startsWith('audio/')
        ? AssetType.Audio
        : AssetType.File;
  if (props.assetTypes.length && !props.assetTypes.includes(type)) {
    message.warning('此文件类型不在允许的素材类型中');
    return false;
  }
  return true;
}
async function handleCustomUpload(options: {
  file: Blob | File | string;
  onError?: (error: Error) => void;
  onSuccess?: (result: AssetDto) => void;
}) {
  if (!(options.file instanceof File) || uploading.value) return;
  uploading.value = true;
  try {
    const asset = await uploadAssetApi(options.file);
    options.onSuccess?.(asset);
    message.success('文件上传成功，已加入选择');
    handleSelectAsset(asset);
    activeTab.value = 'library';
    page.value = 1;
    void loadAssets();
  } catch (error) {
    message.error('文件上传失败');
    options.onError?.(error instanceof Error ? error : new Error('上传失败'));
  } finally {
    uploading.value = false;
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
      <span v-else class="text-sm text-muted-foreground">已选 {{ values.length }} / {{ limit }} 个素材</span>
      <Button :disabled="disabled" @click="openSelectorModal">选择媒体</Button>
    </div>
    <div v-if="committedUrls.length" class="flex flex-wrap gap-2">
      <div
        v-for="url in committedUrls"
        :key="url"
        class="flex max-w-full items-center gap-2 rounded border p-2 text-xs"
      >
        <img
          v-if="
            records.get(url)?.type === AssetType.Image ||
            (!multiple && assetTypes.includes(AssetType.Image))
          "
          :src="records.get(url)?.thumbnailUrl || url"
          class="h-10 w-14 object-cover"
          alt="已选图片"
        />
        <span class="max-w-52 truncate" :title="url">{{
          records.get(url)?.fileName || url
        }}</span>
        <Button
          v-if="records.get(url)"
          type="link"
          size="small"
          @click="preview(records.get(url)!)"
          >
预览
</Button>
        <a
          v-else
          :href="url"
          target="_blank"
          rel="noopener noreferrer"
          class="text-primary"
          >查看</a>
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
      :width="900"
      :confirm-loading="uploading"
      :ok-button-props="{
        disabled: loading || disabled || !selectedUrls.length,
      }"
      :mask-closable="!uploading"
      :closable="!uploading"
      :cancel-button-props="{ disabled: uploading }"
      @ok="confirmSelection"
    >
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane key="library" tab="媒体库">
          <div class="mb-4 flex flex-wrap items-center gap-3">
            <InputSearch
              v-model:value="searchKeyword"
              placeholder="搜索文件名"
              class="max-w-72"
              allow-clear
              @search="filterChanged"
            />
            <Select
              v-model:value="typeFilter"
              :options="allowedTypes"
              :allow-clear="!assetTypes.length"
              placeholder="全部类型"
              class="w-32"
              @change="filterChanged"
            />
            <span class="text-sm">{{
              multiple ? `已选 ${selectedUrls.length} / ${limit}` : '单选'
            }}</span>
          </div>
          <div v-if="selectedUrls.length" class="mb-3 flex flex-wrap gap-2">
            <Button
              v-for="url in selectedUrls"
              :key="url"
              :disabled="disabled || uploading"
              size="small"
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
              class="grid max-h-[440px] grid-cols-2 gap-3 overflow-y-auto p-1 sm:grid-cols-3 lg:grid-cols-4"
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
                  :aria-pressed="selectedUrls.includes(toRelativeAssetUrl(asset.url))"
                  @click="handleSelectAsset(asset)"
                >
                  <div
                    class="relative flex h-24 items-center justify-center bg-muted/20"
                  >
                    <img
                      v-if="
                        asset.thumbnailUrl || asset.type === AssetType.Image
                      "
                      :src="asset.thumbnailUrl || asset.url"
                      :alt="asset.fileName"
                      loading="lazy"
                      class="h-full w-full object-contain"
                    />
                    <span v-else class="text-2xl">{{
                      asset.type === AssetType.Video
                        ? '▶'
                        : asset.type === AssetType.Audio
                          ? '♫'
                          : '▤'
                    }}</span>
                    <span
                      v-if="selectedUrls.includes(toRelativeAssetUrl(asset.url))"
                      class="absolute right-1 top-1 rounded bg-primary px-2 text-primary-foreground"
                      >✓</span>
                  </div>
                  <div class="space-y-1 p-2 text-xs">
                    <div class="truncate font-medium" :title="asset.fileName">
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
                    <div class="truncate text-muted-foreground">
                      {{ asset.extension || asset.mimeType }}
                    </div>
                  </div>
                </button>
                <Button
                  type="link"
                  size="small"
                  class="mb-1"
                  @click="preview(asset)"
                  >
预览 / 详细信息
</Button>
              </div>
            </div>
            <Empty v-else description="暂无符合条件的素材" class="py-8" />
            <Pagination
              v-if="totalCount > pageSize"
              v-model:current="page"
              :page-size="pageSize"
              :total="totalCount"
              :show-size-changer="false"
              class="mt-4"
              size="small"
              @change="loadAssets"
            />
          </Spin>
        </Tabs.TabPane>
        <Tabs.TabPane key="upload" tab="上传素材">
          <Spin :spinning="uploading">
            <UploadDragger
              :disabled="uploading || disabled"
              :multiple="false"
              :accept="accept"
              :before-upload="beforeUpload"
              :custom-request="handleCustomUpload"
              :show-upload-list="false"
            >
              <p class="p-8">点击或拖拽文件上传</p>
              <p class="pb-4 text-xs text-muted-foreground">
                上传后加入待选列表，点击确定保存选择。视频封面和媒体信息会在浏览器支持时自动读取。
              </p>
            </UploadDragger>
          </Spin>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
    <MediaPreview v-model:open="previewOpen" :asset="previewAsset" />
  </div>
</template>
