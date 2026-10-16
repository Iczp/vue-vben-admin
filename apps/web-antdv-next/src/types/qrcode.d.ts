declare module 'qrcode' {
  export interface QRCodeRenderersOptions {
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?:
      | 'H'
      | 'high'
      | 'L'
      | 'low'
      | 'M'
      | 'medium'
      | 'Q'
      | 'quartile';
    margin?: number;
    scale?: number;
    small?: boolean;
    version?: number;
    width?: number;
  }

  export function toDataURL(
    text: Buffer | string,
    options?: QRCodeRenderersOptions,
  ): Promise<string>;

  export function toDataURL(
    text: Buffer | string,
    callback: (error: Error | null | undefined, url: string) => void,
  ): void;

  export function toDataURL(
    text: Buffer | string,
    options: QRCodeRenderersOptions,
    callback: (error: Error | null | undefined, url: string) => void,
  ): void;

  export function toString(
    text: Buffer | string,
    options?: QRCodeRenderersOptions,
  ): Promise<string>;

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: Buffer | string,
    options?: QRCodeRenderersOptions,
  ): Promise<void>;
}
