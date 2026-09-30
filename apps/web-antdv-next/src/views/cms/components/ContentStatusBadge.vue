<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'antdv-next';

import { ArticleStatus } from '#/api/cms';

const props = defineProps<{
  status?: ArticleStatus | number;
}>();

const statusConfig = computed(() => {
  switch (props.status) {
    case ArticleStatus.Draft: {
      return { color: 'default', text: '草稿' };
    }
    case ArticleStatus.PendingReview: {
      return { color: 'processing', text: '审核中' };
    }
    case ArticleStatus.Approved: {
      return { color: 'cyan', text: '已审核' };
    }
    case ArticleStatus.Scheduled: {
      return { color: 'purple', text: '定时发布' };
    }
    case ArticleStatus.Published: {
      return { color: 'success', text: '已发布' };
    }
    case ArticleStatus.Offline: {
      return { color: 'warning', text: '已下线' };
    }
    case ArticleStatus.Archived: {
      return { color: 'error', text: '已归档' };
    }
    default: {
      return { color: 'default', text: '未知' };
    }
  }
});
</script>

<template>
  <Tag :color="statusConfig.color">
    {{ statusConfig.text }}
  </Tag>
</template>
