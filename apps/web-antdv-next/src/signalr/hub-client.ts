/**
 * SignalR 通用连接客户端管理器
 * 支持扫码登录 (ScanLoginHub)、聊天业务 (ChatHub) 及任意自定义 Hub
 */
import type { HubConnection, LogLevel } from '@microsoft/signalr';

import type { Ref } from 'vue';

import type { HubConnectionStatus, SignalRConnectionConfig } from './types';

import { ref } from 'vue';

import {
  HttpTransportType,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';

import { getAppId, getDeviceId, getDeviceType } from '#/utils/device';

import { signalRConfig } from './config';

function getBrowserName(): string {
  if (typeof navigator === 'undefined') return 'Unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Browser';
}

export class HubConnectionClient {
  private connection: HubConnection | null = null;
  private config: SignalRConnectionConfig;
  public status: Ref<HubConnectionStatus> = ref('Disconnected');

  private pendingHandlers = new Map<
    string,
    Set<(...args: any[]) => void>
  >();

  private lifecycleListeners = {
    close: new Set<(error?: Error) => void>(),
    connected: new Set<() => void>(),
    error: new Set<(error: any) => void>(),
    reconnected: new Set<(connectionId?: string) => void>(),
    reconnecting: new Set<(error?: Error) => void>(),
  };

  constructor(config: SignalRConnectionConfig) {
    this.config = {
      reconnectDelays: signalRConfig.reconnectDelays,
      skipNegotiation: signalRConfig.skipNegotiation,
      transport: HttpTransportType.WebSockets,
      withDeviceParams: true,
      ...config,
    };
  }

  /**
   * 构造完整的 Hub 连接 URL 并拼接设备参数与自定义 Query
   */
  private async buildFullUrl(): Promise<string> {
    const rawBase =
      this.config.baseUrl || signalRConfig.baseUrl || '';
    const hubPath = this.config.hubPath.startsWith('/')
      ? this.config.hubPath
      : `/${this.config.hubPath}`;

    let fullUrl = `${rawBase.replace(/\/+$/, '')}${hubPath}`;

    const queryParams: Record<string, string> = {};

    if (this.config.withDeviceParams) {
      try {
        const [deviceId, deviceType] = await Promise.all([
          getDeviceId(),
          getDeviceType(),
        ]);
        queryParams.appId = getAppId();
        queryParams.appName =
          (import.meta.env.VITE_APP_TITLE as string) || 'Goto IM';
        queryParams.deviceId = deviceId;
        queryParams.deviceType = deviceType;
        queryParams.platform = 'web';
        queryParams.browser = getBrowserName();
      } catch (err) {
        console.warn('[SignalR] Failed to gather device info for Hub URL:', err);
      }
    }

    if (this.config.queryParams) {
      for (const [key, value] of Object.entries(this.config.queryParams)) {
        if (value !== undefined && value !== null) {
          queryParams[key] = String(value);
        }
      }
    }

    const searchParams = new URLSearchParams(queryParams);
    const queryString = searchParams.toString();
    if (queryString) {
      fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }

    return fullUrl;
  }

  /**
   * 初始化并构建底层 HubConnection 实例
   */
  private async ensureConnection(): Promise<HubConnection> {
    if (this.connection) {
      return this.connection;
    }

    const fullUrl = await this.buildFullUrl();

    let builder = new HubConnectionBuilder().withUrl(fullUrl, {
      accessTokenFactory: async () => {
        if (this.config.accessTokenFactory) {
          const token = await this.config.accessTokenFactory();
          return token || '';
        }
        return '';
      },
      skipNegotiation: this.config.skipNegotiation ?? true,
      transport: this.config.transport ?? HttpTransportType.WebSockets,
    });

    if (
      this.config.reconnectDelays &&
      this.config.reconnectDelays.length > 0
    ) {
      builder = builder.withAutomaticReconnect(this.config.reconnectDelays);
    }

    if (this.config.logLevel !== undefined) {
      builder = builder.configureLogging(this.config.logLevel as LogLevel);
    }

    const connection = builder.build();

    // 绑定生命周期事件
    connection.onreconnecting((error) => {
      this.status.value = 'Reconnecting';
      this.lifecycleListeners.reconnecting.forEach((fn) => fn(error));
    });

    connection.onreconnected((connectionId) => {
      this.status.value = 'Connected';
      this.lifecycleListeners.reconnected.forEach((fn) => fn(connectionId));
    });

    connection.onclose((error) => {
      this.status.value = 'Disconnected';
      this.lifecycleListeners.close.forEach((fn) => fn(error));
    });

    // 绑定在此之前注册的监听回调
    for (const [methodName, handlers] of this.pendingHandlers.entries()) {
      for (const handler of handlers) {
        connection.on(methodName, handler);
      }
    }

    this.connection = connection;
    return connection;
  }

  /**
   * 启动连接
   */
  public async start(): Promise<void> {
    const conn = await this.ensureConnection();

    if (conn.state === HubConnectionState.Connected) {
      this.status.value = 'Connected';
      return;
    }

    if (conn.state === HubConnectionState.Connecting) {
      return;
    }

    try {
      this.status.value = 'Connecting';
      await conn.start();
      this.status.value = 'Connected';
      this.lifecycleListeners.connected.forEach((fn) => fn());
    } catch (error) {
      this.status.value = 'Disconnected';
      this.lifecycleListeners.error.forEach((fn) => fn(error));
      throw error;
    }
  }

  /**
   * 停止并释放连接
   */
  public async stop(): Promise<void> {
    if (!this.connection) {
      this.status.value = 'Disconnected';
      return;
    }

    try {
      if (
        this.connection.state === HubConnectionState.Connected ||
        this.connection.state === HubConnectionState.Connecting ||
        this.connection.state === HubConnectionState.Reconnecting
      ) {
        await this.connection.stop();
      }
    } catch (error) {
      console.warn('[SignalR] Error while stopping hub connection:', error);
    } finally {
      this.status.value = 'Disconnected';
    }
  }

  /**
   * 订阅服务端方法
   */
  public on(methodName: string, newMethod: (...args: any[]) => void): void {
    if (!this.pendingHandlers.has(methodName)) {
      this.pendingHandlers.set(methodName, new Set());
    }
    this.pendingHandlers.get(methodName)!.add(newMethod);

    if (this.connection) {
      this.connection.on(methodName, newMethod);
    }
  }

  /**
   * 取消订阅服务端方法
   */
  public off(methodName: string, method?: (...args: any[]) => void): void {
    if (method) {
      this.pendingHandlers.get(methodName)?.delete(method);
      if (this.connection) {
        this.connection.off(methodName, method);
      }
    } else {
      this.pendingHandlers.delete(methodName);
      if (this.connection) {
        this.connection.off(methodName);
      }
    }
  }

  /**
   * 调用 Hub 上的方法并等待返回值
   */
  public async invoke<T = any>(
    methodName: string,
    ...args: any[]
  ): Promise<T> {
    const conn = await this.ensureConnection();
    if (conn.state !== HubConnectionState.Connected) {
      await this.start();
    }
    return conn.invoke<T>(methodName, ...args);
  }

  /**
   * 向 Hub 发送消息（不等待返回值）
   */
  public async send(methodName: string, ...args: any[]): Promise<void> {
    const conn = await this.ensureConnection();
    if (conn.state !== HubConnectionState.Connected) {
      await this.start();
    }
    return conn.send(methodName, ...args);
  }

  /**
   * 获取底层连接 ID
   */
  public getConnectionId(): null | string {
    return this.connection?.connectionId || null;
  }

  /**
   * 获取连接原生状态
   */
  public getState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  /**
   * 注册生命周期回调
   */
  public onConnected(cb: () => void): () => void {
    this.lifecycleListeners.connected.add(cb);
    return () => this.lifecycleListeners.connected.delete(cb);
  }

  public onReconnecting(cb: (error?: Error) => void): () => void {
    this.lifecycleListeners.reconnecting.add(cb);
    return () => this.lifecycleListeners.reconnecting.delete(cb);
  }

  public onReconnected(cb: (connectionId?: string) => void): () => void {
    this.lifecycleListeners.reconnected.add(cb);
    return () => this.lifecycleListeners.reconnected.delete(cb);
  }

  public onClose(cb: (error?: Error) => void): () => void {
    this.lifecycleListeners.close.add(cb);
    return () => this.lifecycleListeners.close.delete(cb);
  }

  public onError(cb: (error: any) => void): () => void {
    this.lifecycleListeners.error.add(cb);
    return () => this.lifecycleListeners.error.delete(cb);
  }

  /**
   * 销毁连接与所有监听器
   */
  public async dispose(): Promise<void> {
    for (const [methodName] of this.pendingHandlers) {
      this.connection?.off(methodName);
    }
    this.pendingHandlers.clear();

    this.lifecycleListeners.connected.clear();
    this.lifecycleListeners.reconnecting.clear();
    this.lifecycleListeners.reconnected.clear();
    this.lifecycleListeners.close.clear();
    this.lifecycleListeners.error.clear();

    await this.stop();
    this.connection = null;
  }
}
