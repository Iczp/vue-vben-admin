<script lang="ts" setup>
import type { AssetDto, AssetScope } from '#/api/cms';

import { computed, markRaw, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Divider,
  message,
  Progress,
  RadioButton,
  RadioGroup,
  Slider,
  Spin,
  Tag,
  Upload,
  UploadDragger,
} from 'antdv-next';

import { uploadAssetApi } from '#/api/cms';
import {
  createThumbnailFromFile,
  extractVideoFrame,
} from '#/api/cms/media-metadata';

const emit = defineEmits<{
  success: [asset?: AssetDto];
}>();
const UploadIcon = markRaw(createIconifyIcon('lucide:upload-cloud'));
const VideoIcon = markRaw(createIconifyIcon('lucide:video'));
const ImageIcon = markRaw(createIconifyIcon('lucide:image'));

interface QueueItem {
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

const queue = ref<QueueItem[]>([]);
const isRunningQueue = ref(false);
const activeVideoItemId = ref<null | string>(null);

const currentFolderId = ref<string | undefined>(undefined);
const currentScope = ref<AssetScope | undefined>(undefined);

const activeVideoItem = computed(() =>
  queue.value.find((item) => item.id === activeVideoItemId.value),
);

const stats = computed(() => {
  const total = queue.value.length;
  const success = queue.value.filter((i) => i.status === 'success').length;
  const error = queue.value.filter((i) => i.status === 'error').length;
  const pending = queue.value.filter(
    (i) => i.status === 'pending' || i.status === 'extracting',
  ).length;
  const uploading = queue.value.filter((i) => i.status === 'uploading').length;
  const percent = total > 0 ? Math.round((success / total) * 100) : 0;
  return { error, pending, percent, success, total, uploading };
});

function resetState() {
  queue.value = [];
  isRunningQueue.value = false;
  activeVideoItemId.value = null;
}

function isVideoFile(file: File): boolean {
  return (
    file.type.startsWith('video/') ||
    /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.name)
  );
}

// 多选/拖拽加入上传队列
function onBeforeUpload(file: File) {
  const id = `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const isVid = isVideoFile(file);

  const newItem: QueueItem = {
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

  queue.value.push(newItem);

  if (isVid) {
    if (!activeVideoItemId.value) {
      activeVideoItemId.value = id;
    }
    void extractItemVideoFrame(newItem, 0.1);
  } else if (file.type.startsWith('image/')) {
    void generateQueueImageThumbnail(newItem);
  }

  return false; // 阻止自动上传，放入队列统一按序上传
}

async function generateQueueImageThumbnail(item: QueueItem) {
  const target = queue.value.find((i) => i.id === item.id);
  if (!target) return;
  try {
    const thumb = await createThumbnailFromFile(target.file, 360);
    target.thumbnailFile = thumb.file;
    target.thumbnailUrl = URL.createObjectURL(thumb.file);
  } catch {
    // 忽略非标准图片缩略图异常
  }
}

async function extractItemVideoFrame(item: QueueItem, timeSec: number) {
  const target = queue.value.find((i) => i.id === item.id);
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

function onSliderChange(value: number) {
  const item = activeVideoItem.value;
  if (!item) return;
  item.captureTime = value;
  void extractItemVideoFrame(item, value);
}

async function onCustomCoverSelected(file: File) {
  const item = activeVideoItem.value;
  if (!item) return false;
  if (!file.type.startsWith('image/')) {
    message.error('封面必须为图片格式 (JPG/PNG/WebP等)');
    return false;
  }
  item.extracting = true;
  try {
    const thumb = await createThumbnailFromFile(file);
    item.thumbnailFile = thumb.file;
    item.thumbnailUrl = URL.createObjectURL(thumb.file);
    message.success(`已为【${item.file.name}】设置自定义封面`);
  } catch {
    message.error('封面图片处理失败');
  } finally {
    item.extracting = false;
  }
  return false;
}

function removeQueueItem(id: string) {
  if (isRunningQueue.value) return;
  queue.value = queue.value.filter((i) => i.id !== id);
  if (activeVideoItemId.value === id) {
    activeVideoItemId.value = queue.value.find((i) => i.isVideo)?.id || null;
  }
}

function clearCompleted() {
  queue.value = queue.value.filter((i) => i.status !== 'success');
}

// 顺序执行队列上传
async function startQueueUpload() {
  const pendingItems = queue.value.filter(
    (i) => i.status === 'pending' || i.status === 'error',
  );
  if (pendingItems.length === 0) {
    if (queue.value.some((i) => i.status === 'extracting')) {
      message.warning('正在提取视频封面帧，请稍候...');
      return;
    }
    message.warning('请先选择待上传的文件');
    return;
  }

  isRunningQueue.value = true;
  let successCount = 0;
  let lastUploaded: AssetDto | undefined;

  for (const item of queue.value) {
    if (item.status !== 'pending' && item.status !== 'error') {
      continue;
    }

    // 如果视频还在截取帧，等待完成
    if (item.extracting) {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    item.status = 'uploading';
    item.errorMsg = undefined;

    try {
      const res = await uploadAssetApi(
        item.file,
        item.thumbnailFile || undefined,
        currentFolderId.value,
        currentScope.value,
      );
      item.status = 'success';
      item.result = res;
      lastUploaded = res;
      successCount++;
    } catch (error: any) {
      item.status = 'error';
      item.errorMsg =
        error?.response?.data?.error?.message || error?.message || '上传失败';
    }
  }

  isRunningQueue.value = false;

  if (successCount > 0) {
    emit('success', lastUploaded);
  }

  const failedCount = queue.value.filter((i) => i.status === 'error').length;
  if (failedCount === 0 && successCount > 0) {
    message.success(`全部 ${successCount} 个文件队列上传成功`);
    modalApi.close();
  } else if (successCount > 0 && failedCount > 0) {
    message.warning(
      `成功上传 ${successCount} 个文件，${failedCount} 个失败（可点击重试）`,
    );
  } else if (failedCount > 0) {
    message.error('文件上传失败，请检查后重试');
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const data = modalApi.getData<{
        folderId?: string;
        scope?: AssetScope;
      }>();
      currentFolderId.value = data?.folderId;
      currentScope.value = data?.scope;
    }
  },
  title: '批量队列上传素材',
});
</script>

<template>
  <Modal class="w-[720px]">
    <div class="py-1 space-y-4">
      <!-- 顶部多文件拖拽区 -->
      <UploadDragger
        :multiple="true"
        :disabled="isRunningQueue"
        :show-upload-list="false"
        :before-upload="onBeforeUpload"
      >
        <p class="ant-upload-drag-icon flex justify-center py-2">
          <UploadIcon class="size-10 text-primary" />
        </p>
        <p class="ant-upload-text font-medium text-sm">
          点击或将多个文件拖拽至此区域加入上传队列
        </p>
        <p class="ant-upload-hint text-xs text-muted-foreground px-4">
          支持多选批量添加视频 (MP4/WebM)、图片
          (PNG/JPG/GIF/WebP)、音频与常用文档；视频文件自动提取封面帧，也可点击队列中的视频单独定制封面。
        </p>
      </UploadDragger>

      <!-- 上传队列列表 -->
      <div v-if="queue.length > 0" class="space-y-3">
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center gap-2">
            <span class="font-semibold text-sm">
              待上传队列 ({{ stats.success }} / {{ stats.total }})
            </span>
            <Tag v-if="stats.uploading > 0" color="processing">
              正在队列上传中...
            </Tag>
            <Tag v-else-if="stats.error > 0" color="error">
              失败 {{ stats.error }} 项
            </Tag>
          </div>
          <div class="flex items-center gap-2">
            <Button
              v-if="stats.success > 0 && !isRunningQueue"
              size="small"
              type="link"
              @click="clearCompleted"
            >
              清理已完成
            </Button>
            <Button
              v-if="!isRunningQueue"
              size="small"
              type="text"
              danger
              @click="resetState"
            >
              清空队列
            </Button>
          </div>
        </div>

        <Progress
          v-if="isRunningQueue || stats.success > 0"
          :percent="stats.percent"
          :status="
            stats.error > 0
              ? 'exception'
              : stats.percent === 100
                ? 'success'
                : 'active'
          "
          size="small"
        />

        <!-- 队列滚动列表 -->
        <div
          class="max-h-[240px] overflow-y-auto border rounded divide-y bg-muted/10"
        >
          <div
            v-for="(item, idx) in queue"
            :key="item.id"
            class="flex items-center justify-between px-3 py-2 text-xs hover:bg-muted/30 transition-colors"
            :class="{
              'bg-primary/5': activeVideoItemId === item.id,
            }"
          >
            <div class="flex items-center gap-2.5 min-w-0 flex-1">
              <span class="text-muted-foreground font-mono w-5 shrink-0">
                #{{ idx + 1 }}
              </span>

              <!-- 缩略预览 -->
              <div
                class="w-10 h-8 rounded border bg-black/80 overflow-hidden flex items-center justify-center shrink-0"
              >
                <img
                  v-if="item.thumbnailUrl"
                  :src="item.thumbnailUrl"
                  class="w-full h-full object-cover"
                  alt=""
                />
                <VideoIcon v-else-if="item.isVideo" class="size-4 text-white" />
                <ImageIcon v-else class="size-4 text-white/70" />
              </div>

              <div class="min-w-0 flex-1">
                <div class="font-medium truncate" :title="item.file.name">
                  {{ item.file.name }}
                </div>
                <div
                  class="text-muted-foreground flex items-center gap-2 mt-0.5"
                >
                  <span>{{ (item.file.size / 1024 / 1024).toFixed(2) }} MB</span>
                  <span v-if="item.errorMsg" class="text-destructive truncate">
                    {{ item.errorMsg }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 状态与操作 -->
            <div class="flex items-center gap-2 shrink-0 ml-2">
              <Button
                v-if="item.isVideo && item.status !== 'success'"
                size="small"
                :type="activeVideoItemId === item.id ? 'primary' : 'dashed'"
                ghost
                class="!text-xs !px-2 !h-6"
                @click="
                  activeVideoItemId =
                    activeVideoItemId === item.id ? null : item.id
                "
              >
                🎞️ 定制封面
              </Button>

              <Tag
                v-if="item.status === 'extracting'"
                color="orange"
                class="!m-0"
              >
                提取帧中
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
                上传中...
              </Tag>
              <Tag
                v-else-if="item.status === 'success'"
                color="success"
                class="!m-0"
              >
                ✓ 已完成
              </Tag>
              <Tag
                v-else-if="item.status === 'error'"
                color="error"
                class="!m-0"
              >
                失败
              </Tag>

              <Button
                v-if="!isRunningQueue && item.status !== 'success'"
                type="text"
                danger
                size="small"
                class="!px-1.5 !h-6"
                title="移出队列"
                @click="removeQueueItem(item.id)"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>

        <!-- 选中的视频专属封面定制面板 -->
        <div
          v-if="activeVideoItem"
          class="border rounded p-3 bg-background space-y-2.5 shadow-xs"
        >
          <div class="flex items-center justify-between border-b pb-2">
            <span
              class="font-medium text-xs flex items-center gap-1.5 truncate"
            >
              <span>🎬 视频封面定制：</span>
              <span class="text-primary truncate max-w-[260px]">
                {{ activeVideoItem.file.name }}
              </span>
            </span>

            <div class="flex items-center gap-2 shrink-0">
              <RadioGroup
                v-model:value="activeVideoItem.coverMode"
                size="small"
                button-style="solid"
              >
                <RadioButton value="auto">截取视频帧</RadioButton>
                <RadioButton value="custom">上传封面图</RadioButton>
              </RadioGroup>
              <Button
                size="small"
                type="text"
                @click="activeVideoItemId = null"
              >
                收起
              </Button>
            </div>
          </div>

          <Spin :spinning="activeVideoItem.extracting" tip="正在截取画面...">
            <div class="flex gap-4 items-start">
              <div
                class="w-[160px] h-[96px] border rounded bg-black/90 overflow-hidden flex items-center justify-center shrink-0 relative"
              >
                <img
                  v-if="activeVideoItem.thumbnailUrl"
                  :src="activeVideoItem.thumbnailUrl"
                  class="max-w-full max-h-full object-contain"
                  alt="视频封面预览"
                />
                <div v-else class="text-xs text-white/60 text-center p-2">
                  暂无封面预览
                </div>
              </div>

              <div
                v-if="activeVideoItem.coverMode === 'auto'"
                class="flex-1 space-y-1.5 min-w-0"
              >
                <div class="text-xs text-muted-foreground">
                  拖动滑块截取视频不同秒数画面作为封面：
                </div>
                <Slider
                  v-model:value="activeVideoItem.captureTime"
                  :min="0"
                  :max="
                    activeVideoItem.videoDuration > 0
                      ? Number(activeVideoItem.videoDuration.toFixed(1))
                      : 10
                  "
                  :step="0.5"
                  @after-change="onSliderChange"
                />
                <div
                  class="flex justify-between items-center text-xs text-muted-foreground"
                >
                  <span>当前截取点: {{ activeVideoItem.captureTime }} 秒</span>
                  <span>
                    总时长:
                    {{
                      activeVideoItem.videoDuration > 0
                        ? `${activeVideoItem.videoDuration.toFixed(1)} 秒`
                        : '获取中...'
                    }}
                  </span>
                </div>
              </div>

              <div v-else class="flex-1 space-y-2">
                <div class="text-xs text-muted-foreground">
                  选择本地图片作为该视频的专属封面：
                </div>
                <Upload
                  :show-upload-list="false"
                  accept="image/*"
                  :before-upload="onCustomCoverSelected"
                >
                  <Button size="small">
                    <template #icon><ImageIcon class="size-3.5" /></template>
                    选择本地图片作为封面
                  </Button>
                </Upload>
              </div>
            </div>
          </Spin>
        </div>
      </div>

      <Divider class="my-2" />

      <!-- 底部操作栏 -->
      <div class="flex items-center justify-between pt-1">
        <span class="text-xs text-muted-foreground">
          {{
            queue.length > 0
              ? `共 ${stats.total} 个文件，待上传 ${stats.pending + stats.error} 个`
              : '支持一次框选或拖入多个文件'
          }}
        </span>
        <div class="flex items-center gap-2">
          <Button :disabled="isRunningQueue" @click="modalApi.close()">
            关闭
          </Button>
          <Button
            type="primary"
            :loading="isRunningQueue"
            :disabled="
              queue.length === 0 || (stats.pending === 0 && stats.error === 0)
            "
            @click="startQueueUpload"
          >
            {{
              stats.error > 0 && stats.pending === 0
                ? `重试失败项 (${stats.error})`
                : `开始队列上传 (${stats.pending + stats.error})`
            }}
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
