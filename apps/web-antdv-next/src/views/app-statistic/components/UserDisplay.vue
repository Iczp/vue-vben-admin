<script lang="ts" setup>
import type { UserDataDto } from '#/api/identity/user-lookup';

import { onMounted, ref, watch } from 'vue';

import { message, Tooltip as ATooltip } from 'antdv-next';

import { CopyIcon, UserIcon } from '../utils/icons';
import { formatUserDisplayName, lookupUser } from '../utils/user-lookup';

interface Props {
  userId?: string;
  showCopy?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  userId: undefined,
  showCopy: true,
});

const user = ref<UserDataDto | null>(null);
const loading = ref(false);

async function fetchUser() {
  if (!props.userId || props.userId === '00000000-0000-0000-0000-000000000000') {
    user.value = null;
    return;
  }
  loading.value = true;
  try {
    user.value = await lookupUser(props.userId);
  } finally {
    loading.value = false;
  }
}

watch(() => props.userId, fetchUser);
onMounted(fetchUser);

async function copyId() {
  if (!props.userId) return;
  try {
    await navigator.clipboard.writeText(props.userId);
    message.success('用户 ID 已复制');
  } catch {
    message.error('复制失败，请手动复制');
  }
}
</script>

<template>
  <div v-if="userId && userId !== '00000000-0000-0000-0000-000000000000'" class="inline-flex flex-col text-left py-0.5">
    <!-- 用户名称 -->
    <div class="flex items-center gap-1 font-medium text-foreground text-xs leading-snug">
      <UserIcon class="text-xs text-primary/70 shrink-0 size-3.5" />
      <span class="truncate max-w-[140px]" :title="formatUserDisplayName(user, userId)">
        {{ formatUserDisplayName(user, userId) }}
      </span>
    </div>
    <!-- 用户 ID -->
    <div class="flex items-center gap-1 text-[11px] text-muted-foreground leading-snug mt-0.5">
      <ATooltip :title="`用户 ID: ${userId}`">
        <span class="font-mono text-muted-foreground/80 truncate max-w-[110px]">
          {{ userId.slice(0, 8) }}...{{ userId.slice(-4) }}
        </span>
      </ATooltip>
      <ATooltip v-if="showCopy" title="复制完整用户 ID">
        <CopyIcon
          class="text-xs cursor-pointer text-muted-foreground/60 hover:text-primary transition-colors size-3"
          @click.stop="copyId"
        />
      </ATooltip>
    </div>
  </div>
  <span v-else class="text-xs text-muted-foreground/60 italic">
    未登录
  </span>
</template>
