<script setup lang="ts">
import type { AssetDto } from '#/api/cms';

import { computed, ref, watch } from 'vue';

import { Image, Modal } from 'antdv-next';

import { AssetType } from '#/api/cms';

import {
  formatMediaDuration,
  formatMediaSize,
  mediaDimensions,
  mediaTypes,
} from './media';
const props = defineProps<{ asset?: AssetDto; open: boolean }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();
const loaded = ref<{ duration?: number; height?: number; width?: number }>({});
watch(
  () => props.asset?.url,
  () => {
    loaded.value = {};
  },
);
const details = computed(() =>
  props.asset ? { ...props.asset, ...loaded.value } : undefined,
);
function onMetadata(event: Event) {
  const media = event.target as HTMLVideoElement;
  loaded.value = {
    ...(Number.isFinite(media.duration) ? { duration: media.duration } : {}),
    ...(media.videoWidth
      ? { width: media.videoWidth, height: media.videoHeight }
      : {}),
  };
}
</script>
<template>
  <Modal
    :open="open"
    title="素材预览与详情"
    :width="860"
    :footer="null"
    destroy-on-close
    @update:open="emit('update:open', $event)"
  >
    <template v-if="asset && details">
      <div
        class="mb-4 flex min-h-36 items-center justify-center overflow-hidden rounded bg-muted/20"
      >
        <Image
          v-if="asset.type === AssetType.Image"
          :src="asset.url"
          :alt="asset.fileName"
          :preview="false"
          class="max-h-[460px] object-contain"
        />
        <video
          v-else-if="asset.type === AssetType.Video"
          :key="asset.url"
          :src="asset.url"
          :poster="asset.thumbnailUrl || undefined"
          controls
          playsinline
          preload="metadata"
          class="max-h-[460px] w-full"
          @loadedmetadata="onMetadata"
        ></video>
        <audio
          v-else-if="asset.type === AssetType.Audio"
          :key="asset.url"
          :src="asset.url"
          controls
          preload="metadata"
          class="w-full"
          @loadedmetadata="onMetadata"
        ></audio>
        <div v-else class="p-8 text-center">
          {{ asset.fileName }}
          <p class="mt-2 text-muted-foreground">此文件类型请下载后查看</p>
        </div>
      </div>
      <dl class="grid grid-cols-[100px_1fr] gap-2 break-all text-sm">
        <dt>文件名称</dt>
        <dd>{{ asset.fileName }}</dd>
        <dt>素材类型</dt>
        <dd>
          {{ mediaTypes.find((item) => item.value === asset?.type)?.label }}
        </dd>
        <dt>文件格式</dt>
        <dd>{{ asset.extension || '未知' }} · {{ asset.mimeType }}</dd>
        <dt>文件大小</dt>
        <dd>
          {{ formatMediaSize(asset.fileSize) }}（{{ asset.fileSize }} 字节）
        </dd>
        <template
          v-if="
            asset.type === AssetType.Image || asset.type === AssetType.Video
          "
          >
<dt>宽 × 高</dt>
          <dd>{{ mediaDimensions(details) }}</dd>
</template>
        <template
          v-if="
            asset.type === AssetType.Video || asset.type === AssetType.Audio
          "
          >
<dt>播放时长</dt>
          <dd>{{ formatMediaDuration(details.duration) }}</dd>
</template>
        <dt>上传时间</dt>
        <dd>
          {{
            asset.creationTime
              ? new Date(asset.creationTime).toLocaleString()
              : '未知'
          }}
        </dd>
        <dt>上传者</dt>
        <dd>{{ asset.actorName || '未提供' }}</dd>
        <dt>资源 ID</dt>
        <dd>{{ asset.id }}</dd>
        <dt>访问地址</dt>
        <dd>
          <a
            :href="asset.url"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary"
            >{{ asset.url }}</a>
        </dd>
        <template v-if="asset.thumbnailUrl">
<dt>缩略图</dt>
          <dd><Image :src="asset.thumbnailUrl" :width="120" /></dd>
</template>
        <template v-if="asset.hash">
<dt>文件哈希</dt>
          <dd>{{ asset.hash }}</dd>
</template>
      </dl>
      <p
        v-if="asset.type === AssetType.Video || asset.type === AssetType.Audio"
        class="mt-3 text-xs text-muted-foreground"
      >
        旧资源缺失的信息会在浏览器成功读取媒体后显示。浏览器不支持的编码可下载后播放。
      </p>
    </template>
  </Modal>
</template>
