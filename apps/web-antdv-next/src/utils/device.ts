import FingerprintJS from '@fingerprintjs/fingerprintjs';

const DEVICE_ID_STORAGE_KEY = '__app_device_id__';
let deviceIdPromise: Promise<string> | null = null;

/**
 * 简单字符串哈希算法 (murmurhash/djb2-like)
 */
function simpleHash(str: string): string {
  let hash1 = 5381;
  let hash2 = 52711;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = (hash1 * 33) ^ char;
    hash2 = (hash2 * 33) ^ char;
  }

  return (
    (hash1 >>> 0).toString(16).padStart(8, '0') +
    (hash2 >>> 0).toString(16).padStart(8, '0')
  );
}

/**
 * 兜底本地浏览器指纹生成算法 (Canvas + WebGL + Screen + Navigator)
 */
function generateLocalFingerprint(): string {
  try {
    const components: string[] = [];

    // 1. UserAgent & Platform
    if (typeof navigator !== 'undefined') {
      components.push(navigator.userAgent || '');
      components.push(navigator.language || '');
      components.push(String(navigator.hardwareConcurrency || ''));
      components.push(String((navigator as any).deviceMemory || ''));
      components.push(navigator.platform || '');
    }

    // 2. Screen & Timezone
    if (typeof screen !== 'undefined') {
      components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);
    }
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch {
      // ignore
    }

    // 3. Canvas Fingerprint
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = "14px 'Arial'";
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('Vben-ABP, <canvas> 1.0', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('Vben-ABP, <canvas> 1.0', 4, 17);
          components.push(canvas.toDataURL());
        }
      } catch {
        // ignore canvas error
      }
    }

    const fingerprintRaw = components.join('###');
    return simpleHash(fingerprintRaw);
  } catch {
    return simpleHash(`fallback_${Date.now()}_${Math.random()}`);
  }
}

/**
 * 获取浏览器设备唯一指纹 (DeviceId)
 * 优先使用 FingerprintJS，并持久化缓存至 localStorage
 */
export async function getDeviceId(): Promise<string> {
  // 1. 优先读取 localStorage 缓存
  try {
    const cached = localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (cached) {
      return cached;
    }
  } catch {
    // ignore storage access error
  }

  // 2. 避免并发请求时重复初始化
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      try {
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        if (result?.visitorId) {
          try {
            localStorage.setItem(DEVICE_ID_STORAGE_KEY, result.visitorId);
          } catch {
            // ignore
          }
          return result.visitorId;
        }
      } catch (err) {
        console.warn(
          '[Device] FingerprintJS load failed, falling back to local fingerprint.',
          err,
        );
      }

      // 3. 兜底本地浏览器指纹
      const fallbackId = generateLocalFingerprint();
      try {
        localStorage.setItem(DEVICE_ID_STORAGE_KEY, fallbackId);
      } catch {
        // ignore
      }
      return fallbackId;
    })();
  }

  return deviceIdPromise;
}

/**
 * 获取设备类型 (DeviceType)
 */
export async function getDeviceType(): Promise<string> {
  if (import.meta.env.VITE_APP_DEVICE_TYPE) {
    return String(import.meta.env.VITE_APP_DEVICE_TYPE);
  }

  if (typeof navigator === 'undefined') {
    return 'Web';
  }

  const ua = navigator.userAgent;

  if (/mobile/i.test(ua)) {
    if (/iPad|iPhone|iPod/.test(ua)) {
      return 'iOS_Web';
    }
    if (/android/i.test(ua)) {
      return 'Android_Web';
    }
    return 'Mobile_Web';
  }

  if (/Macintosh|Mac OS X/i.test(ua)) {
    return 'MacOS_Web';
  }
  if (/Windows/i.test(ua)) {
    return 'Windows_Web';
  }
  if (/Linux/i.test(ua)) {
    return 'Linux_Web';
  }

  return 'Web';
}

/**
 * 获取应用 ID (App-Id)
 */
export function getAppId(): string {
  return (
    (import.meta.env.VITE_APP_ID as string) ||
    (import.meta.env.VITE_AUTH_CLIENT_ID as string) ||
    'IM_Mobile'
  );
}

/**
 * 获取应用版本 (App-Version)
 */
export function getAppVersion(): string {
  return (
    (import.meta.env.VITE_APP_VERSION as string) ||
    (import.meta.env.npm_package_version as string) ||
    '5.7.0'
  );
}
