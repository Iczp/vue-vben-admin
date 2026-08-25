<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { $t } from '@vben/locales';

import { Button, Modal, Spin } from 'antdv-next';
import QRCode from 'qrcode';

import { useScanLogin } from '#/composables';

defineOptions({ name: 'QrCodeLogin' });

const router = useRouter();

const {
  errorMessage,
  initChallenge,
  isCancelled,
  isError,
  isExpired,
  isGranted,
  isRejected,
  isScanned,
  loading,
  qrCodeText,
  refresh,
  remainingSeconds,
  scannerInfo,
  status,
  verificationCode,
} = useScanLogin();

const qrcodeDataUrl = ref('');

watch(
  qrCodeText,
  async (text) => {
    if (text) {
      try {
        qrcodeDataUrl.value = await QRCode.toDataURL(text, {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 220,
        });
      } catch (err) {
        console.error('[ScanLogin] Generate QR data URL error:', err);
      }
    } else {
      qrcodeDataUrl.value = '';
    }
  },
  { immediate: true },
);

/**
 * 刷新二维码处理（已扫码状态下进行防误触二次确认）
 */
function handleRefreshClick() {
  if (isScanned.value) {
    Modal.confirm({
      cancelText: '取消',
      content:
        '手机端正在进行授权确认，此时刷新二维码将导致手机端本次授权失效。确定要重新生成二维码吗？',
      okText: '确定刷新',
      okType: 'danger',
      onOk: async () => {
        await refresh();
      },
      title: '重新生成二维码确认',
    });
  } else {
    refresh();
  }
}

function goToLogin() {
  router.push(LOGIN_PATH);
}

function goToCodeLogin() {
  router.push('/auth/code-login');
}

onMounted(() => {
  initChallenge();
});
</script>

<template>
  <div>
    <!-- 标题与副标题 -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold tracking-tight text-foreground">
        {{ $t('authentication.qrcodeLogin') || '扫码登录' }} 📱
      </h2>
      <p class="mt-2 text-sm text-muted-foreground">
        请使用 Goto IM 手机客户端扫描下方二维码登录
      </p>
    </div>

    <!-- 二维码卡片容器 -->
    <div class="flex flex-col items-center justify-center">
      <div
        class="relative flex size-[240px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/80 bg-background/50 p-3 shadow-xs dark:bg-accent/15"
      >
        <!-- 正常二维码图片 -->
        <img
          v-if="qrcodeDataUrl"
          :class="{
            'opacity-15 blur-[2px]': status !== 'generated',
          }"
          :src="qrcodeDataUrl"
          alt="扫码登录二维码"
          class="size-[214px] rounded-xl object-contain transition-all duration-300"
        />

        <!-- 状态遮罩 1: 正在连接/生成中 -->
        <div
          v-if="status === 'connecting' || (!qrcodeDataUrl && loading)"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xs"
        >
          <Spin size="large" />
          <span class="mt-3 text-xs font-medium text-muted-foreground">
            正在安全建立连接...
          </span>
        </div>

        <!-- 状态遮罩 2: 已扫码，等待手机端确认 -->
        <div
          v-else-if="isScanned"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center backdrop-blur-xs"
        >
          <div
            class="flex size-14 items-center justify-center rounded-full bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400"
          >
            <svg
              class="size-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 13l4 4L19 7"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
              />
            </svg>
          </div>
          <span class="mt-2.5 font-bold text-foreground">已成功扫码</span>
          <span
            v-if="scannerInfo.scanUserName || scannerInfo.scanUserId"
            class="mt-1 text-xs text-primary"
          >
            账号：{{ scannerInfo.scanUserName || scannerInfo.scanUserId }}
          </span>
          <span class="mt-1.5 text-xs text-muted-foreground">
            请在手机端点击「确认登录」
          </span>
          <div class="mt-2 flex items-center gap-1.5 text-[11px] text-primary">
            <span class="size-1.5 animate-ping rounded-full bg-primary"></span>
            等待确认中...
          </div>
        </div>

        <!-- 状态遮罩 3: 授权成功，正在登录 -->
        <div
          v-else-if="isGranted"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center backdrop-blur-xs"
        >
          <div
            class="flex size-14 items-center justify-center rounded-full bg-primary/15 text-primary dark:bg-primary/25"
          >
            <Spin size="default" />
          </div>
          <span class="mt-3 font-bold text-foreground">授权成功</span>
          <span class="mt-1 text-xs text-muted-foreground">
            正在安全换取会话并进入系统...
          </span>
        </div>

        <!-- 状态遮罩 4: 二维码已失效/过期 -->
        <div
          v-else-if="isExpired"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center backdrop-blur-xs"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
          >
            <svg
              class="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <span class="mt-2 font-medium text-foreground">二维码已过期</span>
          <Button
            class="mt-3"
            size="small"
            type="primary"
            @click="handleRefreshClick"
          >
            点击刷新
          </Button>
        </div>

        <!-- 状态遮罩 5: 手机端已拒绝 -->
        <div
          v-else-if="isRejected"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center backdrop-blur-xs"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          >
            <svg
              class="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M6 18L18 6M6 6l12 12"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <span class="mt-2 font-medium text-foreground">手机端已拒绝授权</span>
          <Button
            class="mt-3"
            size="small"
            type="primary"
            @click="handleRefreshClick"
          >
            重新生成
          </Button>
        </div>

        <!-- 状态遮罩 6: 授权已取消 -->
        <div
          v-else-if="isCancelled"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center backdrop-blur-xs"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <svg
              class="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <span class="mt-2 font-medium text-foreground">授权已取消</span>
          <Button
            class="mt-3"
            size="small"
            type="primary"
            @click="handleRefreshClick"
          >
            重新生成
          </Button>
        </div>

        <!-- 状态遮罩 7: 错误异常 -->
        <div
          v-else-if="isError"
          class="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-4 text-center backdrop-blur-xs"
        >
          <div
            class="flex size-12 items-center justify-center rounded-full bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400"
          >
            <svg
              class="size-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
          </div>
          <span class="mt-2 text-xs font-medium text-foreground">
            {{ errorMessage || '连接或生成二维码失败' }}
          </span>
          <Button
            class="mt-3"
            size="small"
            type="primary"
            @click="handleRefreshClick"
          >
            重试
          </Button>
        </div>
      </div>

      <!-- 四位数字安全核验码展示区 (手机扫码后核对使用) -->
      <div
        v-if="verificationCode && (status === 'generated' || isScanned)"
        class="mt-3.5 flex flex-col items-center"
      >
        <span
          class="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span class="size-1.5 animate-pulse rounded-full bg-primary"></span>
          手机核验码 (请核对与手机端一致)
        </span>
        <div class="flex items-center gap-2">
          <span
            v-for="(digit, idx) in verificationCode.split('')"
            :key="idx"
            class="flex size-8 select-text items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-base font-bold tracking-wider text-primary shadow-xs"
          >
            {{ digit }}
          </span>
        </div>
      </div>

      <!-- 倒计时与刷新提示 -->
      <div
        v-if="status === 'generated'"
        class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span>
          二维码有效时间：<strong class="text-primary">{{ remainingSeconds }}</strong> 秒
        </span>
        <span>·</span>
        <button
          class="cursor-pointer font-medium text-primary hover:underline"
          type="button"
          @click="handleRefreshClick"
        >
          手动刷新
        </button>
      </div>
      <div
        v-else-if="isScanned"
        class="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <span>若长时间未响应，可</span>
        <button
          class="cursor-pointer font-medium text-primary hover:underline"
          type="button"
          @click="handleRefreshClick"
        >
          重新生成二维码
        </button>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <div class="mt-6 flex flex-col gap-2.5">
      <Button block class="h-10" @click="goToLogin">
        {{ $t('authentication.backToLogin') || '账号密码登录' }}
      </Button>

      <div class="flex items-center justify-center">
        <span
          class="vben-link cursor-pointer text-xs text-muted-foreground hover:text-primary"
          @click="goToCodeLogin"
        >
          {{ $t('authentication.mobileLogin') || '手机验证码登录' }}
        </span>
      </div>
    </div>
  </div>
</template>
