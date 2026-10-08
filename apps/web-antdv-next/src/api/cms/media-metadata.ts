export interface MediaUploadMetadata {
  duration?: number;
  height?: number;
  thumbnail?: File;
  thumbnailHeight?: number;
  thumbnailWidth?: number;
  width?: number;
}
/** Best effort only: unsupported browser codecs must not prevent a normal upload. */
export async function readMediaUploadMetadata(
  file: File,
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
        image.onload = () => {
          result.width = image.naturalWidth;
          result.height = image.naturalHeight;
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
          media.duration <= 31536000
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
      const capture = () => {
        if (finished || !video) return;
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
