/**
 * SignalR 通用类型与连接契约定义
 */
import type { HttpTransportType, LogLevel } from '@microsoft/signalr';

/**
 * SignalR 连接状态
 */
export type HubConnectionStatus =
  | 'Connecting'
  | 'Connected'
  | 'Disconnected'
  | 'Reconnecting';

/**
 * SignalR 连接配置选项
 */
export interface SignalRConnectionConfig {
  /**
   * SignalR 服务端基准地址（如 http://10.0.5.20:8044）
   * 若不提供则使用相对路径或默认配置
   */
  baseUrl?: string;
  /**
   * Hub 相对路径（如 /signalr-hubs/scan-login 或 /signalr-hubs/chat）
   */
  hubPath: string;
  /**
   * 动态获取 AccessToken 的工厂方法
   */
  accessTokenFactory?: () => null | Promise<null | string> | string;
  /**
   * 是否跳过协商阶段（直接使用 WebSocket）
   * 默认 true
   */
  skipNegotiation?: boolean;
  /**
   * 传输类型，默认 HttpTransportType.WebSockets
   */
  transport?: HttpTransportType;
  /**
   * 自动重连延迟序列（毫秒），如 [0, 2000, 10000, 30000]
   */
  reconnectDelays?: number[];
  /**
   * 附加到 Hub 连接 URL 上的 Query 参数（如设备信息、版本等）
   */
  queryParams?: Record<string, boolean | null | number | string | undefined>;
  /**
   * 是否自动附加通用设备指纹 Query 参数（appId, deviceId, deviceType 等）
   * 默认 true
   */
  withDeviceParams?: boolean;
  /**
   * 日志等级
   */
  logLevel?: LogLevel;
}

/**
 * 扫码登录服务端推送指令枚举
 */
export type ScanLoginCommand =
  | 'cancelled'
  | 'generated'
  | 'granted'
  | 'rejected'
  | 'scanned'
  | 'welcome';

/**
 * 扫码登录统一消息信封 (ReceivedMessage)
 */
export interface ScanLoginEnvelope<T = any> {
  command: ScanLoginCommand | string;
  payload?: T;
}

/**
 * 已扫码 payload
 */
export interface ScanLoginScannedPayload {
  scanUserId?: string;
  scanUserName?: string;
  userName?: string;
}

/**
 * 已授权同意 payload
 */
export interface ScanLoginGrantedPayload {
  expiredTime?: string;
  scanToken: string;
  userId?: string;
  userName?: string;
}

/**
 * 已拒绝 payload
 */
export interface ScanLoginRejectedPayload {
  reason?: string;
}

/**
 * 已取消 payload
 */
export interface ScanLoginCancelledPayload {
  reason?: string;
}

/**
 * 调用 Generate 返回的结果
 */
export interface ScanLoginGenerateResult {
  expiredTime?: string;
  scanText: string;
}

/**
 * 扫码登录前端状态机状态
 */
export type ScanLoginStatus =
  | 'cancelled'
  | 'connecting'
  | 'error'
  | 'expired'
  | 'generated'
  | 'granted'
  | 'idle'
  | 'rejected'
  | 'scanned';
