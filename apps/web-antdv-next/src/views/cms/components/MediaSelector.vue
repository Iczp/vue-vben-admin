<script lang="ts" setup>
import type { AssetDto } from '#/api/cms';

import { computed, markRaw, ref, watch } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Divider,
  Empty,
  Input,
  InputSearch,
  message,
  Modal,
  Pagination,
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

const VideoIcon = markRaw(createIconifyIcon('lucide:video'));
const ImageIcon = markRaw(createIconifyIcon('lucide:image'));

import {
  AssetStatus,
  AssetType,
  getAssetApi,
  getAssetsApi,
  toRelativeAssetUrl,
  uploadAssetApi,
} from '#/api/cms';
import {
  createThumbnailFromFile,
  extractVideoFrame,
} from '#/api/cms/media-metadata';

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
const stagedFile = ref<File | null>(null);
const isStagedVideo = ref(false);
const stagedVideoDuration = ref(0);
const stagedCoverMode = ref<'auto' | 'custom'>('auto');
const stagedCaptureTime = ref(0.1);
const stagedThumbnailFile = ref<File | null>(null);
const stagedThumbnailUrl = ref('');
const extractingVideo = ref(false);

function resetStaged() {
  stagedFile.value = null;
  isStagedVideo.value = false;
  stagedVideoDuration.value = 0;
  stagedCoverMode.value = 'auto';
  stagedCaptureTime.value = 0.1;
  stagedThumbnailFile.value = null;
  stagedThumbnailUrl.value = '';
}

async function extractStagedVideoFrame(timeSec: number) {
  if (!stagedFile.value || !isStagedVideo.value) return;
  extractingVideo.value = true;
  try {
    const res = await extractVideoFrame(stagedFile.value, timeSec);
    stagedVideoDuration.value = res.duration;
    stagedThumbnailFile.value = res.file;
    stagedThumbnailUrl.value = res.dataUrl;
  } catch (error) {
    console.error('视频帧提取失败', error);
  } finally {
    extractingVideo.value = false;
  }
}

function onStagedSliderChange(value: number) {
  stagedCaptureTime.value = value;
  void extractStagedVideoFrame(value);
}

async function onStagedCustomCoverSelected(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('封面必须为图片格式');
    return false;
  }
  extractingVideo.value = true;
  try {
    const thumb = await createThumbnailFromFile(file);
    stagedThumbnailFile.value = thumb.file;
    stagedThumbnailUrl.value = URL.createObjectURL(thumb.file);
    message.success('已应用自定义封面图片');
  } catch (e) {
    message.error('封面图片生成失败');
  } finally {
    extractingVideo.value = false;
  }
  return false;
}

async function submitStagedUpload() {
  if (!stagedFile.value) return;
  uploading.value = true;
  try {
    const asset = await uploadAssetApi(
      stagedFile.value,
      stagedThumbnailFile.value || undefined,
    );
    message.success('文件上传成功，已加入选择');
    handleSelectAsset(asset);
    resetStaged();
    activeTab.value = 'library';
    page.value = 1;
    void loadAssets();
  } catch (error) {
    message.error('文件上传失败');
  } finally {
    uploading.value = false;
  }
}

async function handleCustomUpload(options: {
  file: Blob | File | string;
  onError?: (error: Error) => void;
  onSuccess?: (result: AssetDto) => void;
}) {
  if (!(options.file instanceof File) || uploading.value) return;
  const file = options.file;
  const isVid =
    file.type.startsWith('video/') ||
    /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.name);

  if (isVid) {
    // 视频文件进入专门的封面定制与帧提取界面
    stagedFile.value = file;
    isStagedVideo.value = true;
    stagedCoverMode.value = 'auto';
    stagedCaptureTime.value = 0.1;
    await extractStagedVideoFrame(0.1);
    return;
  }

  // 非视频常规文件直接上传
  uploading.value = true;
  try {
    const asset = await uploadAssetApi(file);
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
            <!-- 场景 1：未选择文件或非视频时的常规拖拽区 -->
            <div v-if="!stagedFile">
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
                  上传后加入待选列表，点击确定保存选择。上传视频文件将支持自定义封面设置与画面帧提取。
                </p>
              </UploadDragger>
            </div>

            <!-- 场景 2：已选定视频，进入封面设置与画面提取面板 -->
            <div v-else class="space-y-4 p-2">
              <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="p-2 rounded bg-primary/10 text-primary shrink-0">
                    <VideoIcon class="size-6" />
                  </div>
                  <div class="overflow-hidden">
                    <div class="font-medium text-sm truncate" :title="stagedFile.name">
                      {{ stagedFile.name }}
                    </div>
                    <div class="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                      <span>{{ (stagedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
                      <Tag color="blue">视频媒体</Tag>
                    </div>
                  </div>
                </div>

                <Button size="small" @click="resetStaged">重新选择</Button>
              </div>

              <!-- 视频专属：封面设置与提取区 -->
              <div class="border rounded p-4 bg-background space-y-3">
                <div class="flex items-center justify-between border-b pb-2">
                  <span class="font-medium text-sm flex items-center gap-2">
                    <span>视频封面设置</span>
                    <span class="text-xs text-muted-foreground font-normal">
                      (可自定义上传或从视频画面截取)
                    </span>
                  </span>

                  <RadioGroup v-model:value="stagedCoverMode" size="small" button-style="solid">
                    <RadioButton value="auto">从视频截取</RadioButton>
                    <RadioButton value="custom">自定义上传</RadioButton>
                  </RadioGroup>
                </div>

                <Spin :spinning="extractingVideo" tip="正在截取画面...">
                  <div class="flex gap-4 items-start">
                    <!-- 封面预览图（完整显示不剪裁） -->
                    <div class="w-[180px] h-[110px] border rounded bg-black/90 overflow-hidden flex items-center justify-center shrink-0 relative shadow-inner">
                      <img
                        v-if="stagedThumbnailUrl"
                        :src="stagedThumbnailUrl"
                        class="max-w-full max-h-full object-contain"
                        alt="视频封面预览"
                      />
                      <div v-else class="text-xs text-white/60 text-center p-2">
                        暂无封面预览
                      </div>

                      <span
                        v-if="stagedThumbnailUrl"
                        class="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded backdrop-blur"
                      >
                        完整封面预览
                      </span>
                    </div>

                    <!-- 模式 A：从视频进度提取 -->
                    <div v-if="stagedCoverMode === 'auto'" class="flex-1 space-y-2 min-w-0">
                      <div class="text-xs text-muted-foreground">
                        拖动滑块截取视频中不同秒数的画面作为封面：
                      </div>
                      <Slider
                        v-model:value="stagedCaptureTime"
                        :min="0"
                        :max="stagedVideoDuration > 0 ? Number(stagedVideoDuration.toFixed(1)) : 10"
                        :step="0.5"
                        @after-change="onStagedSliderChange"
                      />
                      <div class="flex justify-between items-center text-xs text-muted-foreground">
                        <span>当前截取点: {{ stagedCaptureTime }} 秒</span>
                        <span>总时长: {{ stagedVideoDuration > 0 ? `${stagedVideoDuration.toFixed(1)} 秒` : '获取中...' }}</span>
                      </div>
                      <div class="flex gap-2 pt-1">
                        <Button
                          size="small"
                          @click="onStagedSliderChange(0.1)"
                        >
                          首帧
                        </Button>
                        <Button
                          v-if="stagedVideoDuration > 1"
                          size="small"
                          @click="onStagedSliderChange(Number((stagedVideoDuration * 0.25).toFixed(1)))"
                        >
                          1/4 处
                        </Button>
                        <Button
                          v-if="stagedVideoDuration > 2"
                          size="small"
                          @click="onStagedSliderChange(Number((stagedVideoDuration * 0.5).toFixed(1)))"
                        >
                          居中帧
                        </Button>
                      </div>
                    </div>

                    <!-- 模式 B：自定义上传图片封面 -->
                    <div v-else class="flex-1 space-y-2">
                      <div class="text-xs text-muted-foreground">
                        从本地选择一张图片作为此视频的专属封面：
                      </div>
                      <Upload
                        :show-upload-list="false"
                        accept="image/*"
                        :before-upload="onStagedCustomCoverSelected"
                      >
                        <Button size="small">
                          <template #icon><ImageIcon class="size-3.5" /></template>
                          选择本地图片作为封面
                        </Button>
                      </Upload>
                      <p class="text-[11px] text-muted-foreground">
                        推荐上传 16:9 比例 (如 1280x720) 的高清图片。
                      </p>
                    </div>
                  </div>
                </Spin>
              </div>

              <Divider class="my-2" />

              <div class="flex justify-end gap-2 pt-1">
                <Button @click="resetStaged">取消</Button>
                <Button
                  type="primary"
                  :loading="uploading || extractingVideo"
                  @click="submitStagedUpload"
                >
                  确认上传
                </Button>
              </div>
            </div>
          </Spin>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
    <MediaPreview v-model:open="previewOpen" :asset="previewAsset" />
  </div>
</template>
