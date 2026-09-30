<script lang="ts" setup>
import { computed } from 'vue';

import { Tag } from 'antdv-next';

const props = defineProps<{
  type?: string;
}>();

const config = computed(() => {
  switch (props.type?.toLowerCase()) {
    case 'news': {
      return { color: 'blue', text: '新闻资讯' };
    }
    case 'notice': {
      return { color: 'orange', text: '官方公告' };
    }
    case 'video': {
      return { color: 'purple', text: '视频内容' };
    }
    case 'gallery': {
      return { color: 'cyan', text: '图集相册' };
    }
    case 'wiki': {
      return { color: 'geekblue', text: '知识文档' };
    }
    case 'wechat': {
      return { color: 'green', text: '公众号图文' };
    }
    case 'article':
    default: {
      return { color: 'default', text: '普通文章' };
    }
  }
});
</script>

<template>
  <Tag :color="config.color">
    {{ config.text }}
  </Tag>
</template>
