export interface MediaUploadMetadata {
  duration?: number;
  height?: number;
  thumbnail?: File;
  thumbnailHeight?: number;
  thumbnailWidth?: number;
  width?: number;
}

/**
 * 从图片文件生成适合作为封面缩略图的 File (JPEG, 默认最大 640px)
 */
export async function createThumbnailFromFile(
  file: File,
  maxSize: number = 640,
): Promise<{
  file: File;
  height: number;
  width: number;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const scale = Math.min(
        1,
        maxSize / img.naturalWidth,
        maxSize / img.naturalHeight,
      );
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Canvas blob generation failed'));
            return;
          }
          resolve({
            file: new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }),
            height,
            width,
          });
        },
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image loading failed'));
    };
    img.src = url;
  });
}

/**
 * 从远程图片 URL 生成轻量级缩略图 (用于历史无缩略图图片的自动生成与回填)
 */
export async function createThumbnailFromImageUrl(
  imageUrl: string,
  maxSize: number = 360,
): Promise<{
  blobUrl: string;
  file: File;
  height: number;
  width: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => {
      const scale = Math.min(
        1,
        maxSize / img.naturalWidth,
        maxSize / img.naturalHeight,
      );
      const width = Math.max(1, Math.round(img.naturalWidth * scale));
      const height = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas blob generation failed'));
            return;
          }
          const file = new File([blob], 'thumbnail.jpg', {
            type: 'image/jpeg',
          });
          const blobUrl = URL.createObjectURL(blob);
          resolve({
            blobUrl,
            file,
            height,
            width,
          });
        },
        'image/jpeg',
        0.8,
      );
    };
    img.onerror = () => {
      reject(new Error('Image URL loading failed'));
    };
    img.src = imageUrl;
  });
}

/**
 * 从视频文件或视频 URL 中提取指定时间点（默认0.1s或首帧）的画面作为封面缩略图，并准确读取时长
 */
export async function extractVideoFrame(
  videoSource: File | string,
  timeSeconds: number = 0.1,
): Promise<{
  dataUrl: string;
  duration: number;
  file: File;
  height: number;
  thumbnailHeight: number;
  thumbnailWidth: number;
  width: number;
}> {
  return new Promise((resolve, reject) => {
    const isFile = videoSource instanceof File;
    const url = isFile ? URL.createObjectURL(videoSource) : videoSource;
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let cleaned = false;
    let knownDuration = 0;

    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      video.onloadedmetadata = null;
      video.ondurationchange = null;
      video.oncanplay = null;
      video.onseeked = null;
      video.onerror = null;
      video.removeAttribute('src');
      video.load();
      if (isFile) {
        URL.revokeObjectURL(url);
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('提取视频封面超时'));
    }, 12_000);

    video.onerror = (e) => {
      clearTimeout(timer);
      cleanup();
      reject(e);
    };

    const updateDuration = () => {
      if (
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        video.duration !== Infinity
      ) {
        knownDuration = video.duration;
      }
    };

    video.ondurationchange = updateDuration;

    video.onloadedmetadata = () => {
      updateDuration();
      seekToTarget();
    };

    video.oncanplay = () => {
      updateDuration();
      if (!video.currentTime && timeSeconds > 0) {
        seekToTarget();
      }
    };

    function seekToTarget() {
      const targetTime = Math.min(
        timeSeconds,
        knownDuration > 0 ? Math.max(0.01, knownDuration / 2) : 0.1,
      );
      try {
        video.currentTime = targetTime;
      } catch {
        // 部分浏览器若未就绪可能抛出，等待后续事件
      }
    }

    video.onseeked = () => {
      clearTimeout(timer);
      updateDuration();

      // 如果 duration 仍为 0/Infinity，尝试用 currentTime 兜底
      const finalDuration =
        knownDuration > 0
          ? knownDuration
          : Number.isFinite(video.duration) && video.duration > 0
            ? video.duration
            : 0;

      const width = video.videoWidth || 640;
      const height = video.videoHeight || 360;
      const scale = Math.min(1, 640 / width, 640 / height);
      const thumbnailWidth = Math.max(1, Math.round(width * scale));
      const thumbnailHeight = Math.max(1, Math.round(height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cleanup();
        reject(new Error('Canvas context error'));
        return;
      }
      ctx.drawImage(video, 0, 0, thumbnailWidth, thumbnailHeight);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      canvas.toBlob(
        (blob) => {
          cleanup();
          if (!blob) {
            reject(new Error('生成视频截图 Blob 失败'));
            return;
          }
          resolve({
            dataUrl,
            duration: finalDuration,
            file: new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' }),
            height,
            thumbnailHeight,
            thumbnailWidth,
            width,
          });
        },
        'image/jpeg',
        0.85,
      );
    };

    video.src = url;
  });
}

/** Best effort only: unsupported browser codecs must not prevent a normal upload. */
export async function readMediaUploadMetadata(
  file: File,
  customThumbnail?: File,
): Promise<MediaUploadMetadata> {
  if (!/^(image|video|audio)\//.test(file.type)) return {};
  const url = URL.createObjectURL(file);
  let cleanup = () => {};
  try {
    return await new Promise<MediaUploadMetadata>((resolve) => {
      const result: MediaUploadMetadata = {};
      let finished = false;
      const finish = () => {
        if (!finished) {
          finished = true;
          resolve(result);
        }
      };
      const timer = setTimeout(finish, 8000);
      if (file.type.startsWith('image/')) {
        const image = new Image();
        cleanup = () => {
          clearTimeout(timer);
          image.onload = null;
          image.onerror = null;
          image.src = '';
        };
        image.onload = async () => {
          result.width = image.naturalWidth;
          result.height = image.naturalHeight;
          try {
            if (customThumbnail) {
              const thumb = await createThumbnailFromFile(customThumbnail);
              result.thumbnail = thumb.file;
              result.thumbnailWidth = thumb.width;
              result.thumbnailHeight = thumb.height;
            } else {
              const scale = Math.min(
                1,
                360 / image.naturalWidth,
                360 / image.naturalHeight,
              );
              const thumbW = Math.max(
                1,
                Math.round(image.naturalWidth * scale),
              );
              const thumbH = Math.max(
                1,
                Math.round(image.naturalHeight * scale),
              );
              const canvas = document.createElement('canvas');
              canvas.width = thumbW;
              canvas.height = thumbH;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(image, 0, 0, thumbW, thumbH);
                const blob = await new Promise<Blob | null>((r) =>
                  canvas.toBlob(r, 'image/jpeg', 0.8),
                );
                if (blob) {
                  result.thumbnail = new File([blob], 'thumbnail.jpg', {
                    type: 'image/jpeg',
                  });
                  result.thumbnailWidth = thumbW;
                  result.thumbnailHeight = thumbH;
                }
              }
            }
          } catch (error) {
            console.error('图片缩略图生成失败', error);
          }
          finish();
        };
        image.onerror = finish;
        image.src = url;
        return;
      }
      const video = file.type.startsWith('video/');
      const media = document.createElement(video ? 'video' : 'audio');
      media.preload = 'metadata';
      cleanup = () => {
        clearTimeout(timer);
        media.onloadedmetadata = null;
        media.onloadeddata = null;
        media.onseeked = null;
        media.onerror = null;
        media.removeAttribute('src');
        media.load();
      };
      media.onerror = finish;
      media.onloadedmetadata = () => {
        if (
          Number.isFinite(media.duration) &&
          media.duration >= 0 &&
          media.duration <= 31_536_000
        )
          result.duration = media.duration;
        if (!video) {
          finish();
          return;
        }
        const frame = media as HTMLVideoElement;
        if (frame.videoWidth && frame.videoHeight) {
          result.width = frame.videoWidth;
          result.height = frame.videoHeight;
        }
        frame.currentTime = Math.min(
          0.1,
          Number.isFinite(frame.duration) ? frame.duration / 2 : 0,
        );
      };
      const capture = async () => {
        if (finished || !video) return;
        if (customThumbnail) {
          try {
            const thumb = await createThumbnailFromFile(customThumbnail);
            result.thumbnail = thumb.file;
            result.thumbnailWidth = thumb.width;
            result.thumbnailHeight = thumb.height;
          } catch (error) {
            console.error('处理自定义封面失败，使用自动提取封面', error);
          }
          if (result.thumbnail) {
            finish();
            return;
          }
        }
        const frame = media as HTMLVideoElement;
        if (!frame.videoWidth || !frame.videoHeight) {
          finish();
          return;
        }
        const scale = Math.min(
          1,
          640 / frame.videoWidth,
          640 / frame.videoHeight,
        );
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(frame.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(frame.videoHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          finish();
          return;
        }
        try {
          context.drawImage(frame, 0, 0, canvas.width, canvas.height);
          canvas.toBlob(
            (blob) => {
              if (blob && !finished) {
                result.thumbnail = new File([blob], 'thumbnail.jpg', {
                  type: 'image/jpeg',
                });
                result.thumbnailWidth = canvas.width;
                result.thumbnailHeight = canvas.height;
              }
              finish();
            },
            'image/jpeg',
            0.8,
          );
        } catch {
          finish();
        }
      };
      media.onseeked = capture;
      media.onloadeddata = capture;
      media.src = url;
    });
  } finally {
    cleanup();
    URL.revokeObjectURL(url);
  }
}
