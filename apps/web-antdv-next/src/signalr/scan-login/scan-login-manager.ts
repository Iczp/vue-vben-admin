/**
 * 扫码登录专用 SignalR 管理器
 */
import type {
  ScanLoginCancelledPayload,
  ScanLoginEnvelope,
  ScanLoginGenerateResult,
  ScanLoginGrantedPayload,
  ScanLoginRejectedPayload,
  ScanLoginScannedPayload,
} from '../types';

import { fetchScanLoginHubTokenApi } from '#/api/core/scan-login';

import { scanLoginConfig } from '../config';
import { HubConnectionClient } from '../hub-client';

export interface ScanLoginEventCallbacks {
  onCancelled?: (payload: ScanLoginCancelledPayload) => void;
  onError?: (error: any) => void;
  onGranted?: (payload: ScanLoginGrantedPayload) => void;
  onRejected?: (payload: ScanLoginRejectedPayload) => void;
  onScanned?: (payload: ScanLoginScannedPayload) => void;
}

export class ScanLoginManager {
  private client: HubConnectionClient;
  private callbacks: ScanLoginEventCallbacks = {};
  private isSubscribed = false;

  constructor(callbacks?: ScanLoginEventCallbacks) {
    if (callbacks) {
      this.callbacks = callbacks;
    }

    this.client = new HubConnectionClient({
      accessTokenFactory: async () => {
        return fetchScanLoginHubTokenApi();
      },
      baseUrl: scanLoginConfig.signalRBaseUrl,
      hubPath: scanLoginConfig.hubPath,
      skipNegotiation: true,
      withDeviceParams: true,
    });

    this.registerEventListeners();
  }

  /**
   * 注册 Hub 事件监听
   * 必须在 Generate 调用前完成订阅
   */
  private registerEventListeners(): void {
    if (this.isSubscribed) return;

    this.client.on('ReceivedMessage', (envelope: ScanLoginEnvelope) => {
      if (!envelope || !envelope.command) {
        return;
      }

      const command = envelope.command;
      const payload = envelope.payload || {};

      switch (command) {
        case 'scanned': {
          this.callbacks.onScanned?.({
            scanUserId: payload.scanUserId,
            scanUserName: payload.scanUserName || payload.userName,
            userName: payload.userName || payload.scanUserName,
          });
          break;
        }
        case 'granted': {
          if (payload.scanToken) {
            this.callbacks.onGranted?.({
              expiredTime: payload.expiredTime,
              scanToken: payload.scanToken,
              userId: payload.userId,
              userName: payload.userName,
            });
          } else {
            console.warn(
              '[ScanLogin] Received granted command without scanToken, ignored.',
            );
          }
          break;
        }
        case 'rejected': {
          this.callbacks.onRejected?.({
            reason: payload.reason,
          });
          break;
        }
        case 'cancelled': {
          this.callbacks.onCancelled?.({
            reason: payload.reason,
          });
          break;
        }
        case 'welcome':
        case 'generated':
        default: {
          // 兼容保留，不影响流程
          break;
        }
      }
    });

    this.client.onError((err) => {
      this.callbacks.onError?.(err);
    });

    this.isSubscribed = true;
  }

  /**
   * 建立连接并生成扫码挑战
   * @param state 四位随机数字校验码（如 "8451"）
   */
  public async generateChallenge(
    state: string,
  ): Promise<ScanLoginGenerateResult> {
    try {
      await this.client.start();
      const res = await this.client.invoke<ScanLoginGenerateResult>(
        'Generate',
        state,
      );
      return res;
    } catch (error) {
      console.error('[ScanLogin] Generate challenge error:', error);
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  /**
   * 设置回调函数
   */
  public setCallbacks(callbacks: Partial<ScanLoginEventCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * 获取底层连接客户端
   */
  public getClient(): HubConnectionClient {
    return this.client;
  }

  /**
   * 销毁并断开连接
   */
  public async dispose(): Promise<void> {
    this.callbacks = {};
    await this.client.dispose();
  }
}
