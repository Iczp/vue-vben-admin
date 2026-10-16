<script setup lang="ts">
import type { ArticleMessageItem } from '#/api/chat/article-message';

import { webUrl } from './article-draft';
defineProps<{ items: ArticleMessageItem[] }>();
</script>

<template>
  <div class="article-card">
    <a
      v-for="(item, index) in items"
      :key="index"
      :href="webUrl(item.originalUrl) || undefined"
      target="_blank"
      rel="noopener noreferrer"
      class="article-row"
      :class="[{ headline: index === 0 }]"
    >
      <img
        v-if="webUrl(item.coverImageUrl)"
        :src="webUrl(item.coverImageUrl)"
        alt="文章封面"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />
      <div v-else class="cover-placeholder">文章</div>
      <div class="article-text">
        <strong>{{ item.title || '文章标题' }}</strong>
        <template v-if="items.length === 1">
          <p v-if="item.description">{{ item.description }}</p>
          <small v-if="item.author">{{ item.author }}</small>
        </template>
      </div>
    </a>
    <p v-if="items.length === 0" class="p-4">尚未添加文章</p>
  </div>
</template>

<style scoped>
.article-card {
  width: 100%;
  max-width: 340px;
  overflow: hidden;
  background: var(--background, white);
  border: 1px solid #ddd;
  border-radius: 12px;
}

.article-row {
  display: flex;
  flex-direction: row-reverse;
  gap: 12px;
  padding: 12px;
  color: inherit;
  text-decoration: none;
  border-top: 1px solid #ddd;
}

.article-row img,
.cover-placeholder {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  object-fit: cover;
}

.cover-placeholder {
  display: grid;
  place-items: center;
  color: #888;
  background: #eee;
}

.headline {
  flex-direction: column;
  gap: 0;
  padding: 0;
  border-top: 0;
}

.headline img,
.headline .cover-placeholder {
  width: 100%;
  height: 156px;
}

.headline .article-text {
  padding: 12px;
}

.article-text {
  flex: 1;
  min-width: 0;
  overflow-wrap: anywhere;
}

.article-text strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.article-text p {
  margin: 8px 0;
  color: #777;
}
</style>
