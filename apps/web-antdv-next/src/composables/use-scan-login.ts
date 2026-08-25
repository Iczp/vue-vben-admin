/**
 * 扫码登录 Vue 3 组合式 API (useScanLogin)
 * 封装完整的状态机、倒计时、事件处理与登录联动
 */
import type { ScanLoginStatus } from '#/signalr/types';

import { computed, onUnmounted, ref } from 'vue';

import { scanLoginConfig } from '#/signalr/config';
import { ScanLoginManager } from '#/signalr/scan-login/scan-login-manager';
import { useAuthStore } from '#/store';

export function useScanLogin() {
  const authStore = useAuthStore();

  const status = ref<ScanLoginStatus>('idle');
  const qrCodeText = ref<string>('');
  const verificationCode = ref<string>('');
  const remainingSeconds = ref<number>(scanLoginConfig.expiresSeconds);
  const scannerInfo = ref<{ scanUserId?: string; scanUserName?: string }>({});
  const errorMessage = ref<string>('');

  let timer: any = null;
  let manager: null | ScanLoginManager = null;

  const loading = computed(
    () => status.value === 'connecting' || status.value === 'granted',
  );

  const isExpired = computed(() => status.value === 'expired');
  const isScanned = computed(() => status.value === 'scanned');
  const isGranted = computed(() => status.value === 'granted');
  const isRejected = computed(() => status.value === 'rejected');
  const isCancelled = computed(() => status.value === 'cancelled');
  const isError = computed(() => status.value === 'error');

  /**
   * 生成 1000-9999 之间的四位随机数字校验码
   */
  function generateVerificationCode(): string {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  /**
   * 清理倒计时定时器
   */
  function clearCountdown() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  /**
   * 启动有效时间倒计时
   */
  function startCountdown(expiredTime?: string) {
    clearCountdown();

    let totalSeconds = scanLoginConfig.expiresSeconds;

    if (expiredTime) {
      const expDate = new Date(expiredTime).getTime();
      if (!Number.isNaN(expDate)) {
        const diff = Math.floor((expDate - Date.now()) / 1000);
        if (diff > 0) {
          totalSeconds = diff;
        }
      }
    }

    remainingSeconds.value = totalSeconds;

    timer = setInterval(() => {
      if (remainingSeconds.value <= 1) {
        remainingSeconds.value = 0;
        clearCountdown();
        if (
          status.value === 'generated' ||
          status.value === 'scanned' ||
          status.value === 'connecting'
        ) {
          status.value = 'expired';
        }
      } else {
        remainingSeconds.value -= 1;
      }
    }, 1000);
  }

  /**
   * 初始化并生成扫码挑战
   */
  async function initChallenge() {
    clearCountdown();
    status.value = 'connecting';
    errorMessage.value = '';
    scannerInfo.value = {};

    try {
      if (!manager) {
        manager = new ScanLoginManager({
          onCancelled: (payload) => {
            clearCountdown();
            status.value = 'cancelled';
            errorMessage.value = payload.reason || '授权已取消';
          },
          onError: (err) => {
            clearCountdown();
            status.value = 'error';
            errorMessage.value = err?.message || '连接服务器失败，请检查网络';
          },
          onGranted: async (payload) => {
            clearCountdown();
            status.value = 'granted';
            try {
              // 自动执行 OAuth scan-token 兑换与主流程登录
              await authStore.authLoginWithScanToken(payload.scanToken);
            } catch (err: any) {
              status.value = 'error';
              errorMessage.value =
                err?.response?.data?.error_description ||
                err?.message ||
                '登录兑换失败';
            }
          },
          onRejected: (payload) => {
            clearCountdown();
            status.value = 'rejected';
            errorMessage.value = payload.reason || '手机端已拒绝登录';
          },
          onScanned: (payload) => {
            status.value = 'scanned';
            scannerInfo.value = {
              scanUserId: payload.scanUserId,
              scanUserName: payload.scanUserName,
            };
          },
        });
      }

      const code = generateVerificationCode();
      const res = await manager.generateChallenge(code);

      qrCodeText.value = res.scanText;
      verificationCode.value = code;
      status.value = 'generated';
      startCountdown(res.expiredTime);
    } catch (err: any) {
      clearCountdown();
      status.value = 'error';
      errorMessage.value = err?.message || '生成二维码失败，请刷新重试';
    }
  }

  /**
   * 刷新二维码
   */
  async function refresh() {
    await initChallenge();
  }

  /**
   * 销毁与资源释放
   */
  async function dispose() {
    clearCountdown();
    if (manager) {
      await manager.dispose();
      manager = null;
    }
    status.value = 'idle';
  }

  onUnmounted(() => {
    dispose();
  });

  return {
    clearCountdown,
    dispose,
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
  };
}
