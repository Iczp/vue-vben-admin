declare module 'qrcode' {
  export interface QRCodeRenderersOptions {
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: 'H' | 'L' | 'M' | 'Q' | 'high' | 'low' | 'medium' | 'quartile';
    margin?: number;
    scale?: number;
    small?: boolean;
    version?: number;
    width?: number;
  }

  export function toDataURL(
    text: string | Buffer,
    options?: QRCodeRenderersOptions,
  ): Promise<string>;

  export function toDataURL(
    text: string | Buffer,
    callback: (error: Error | null | undefined, url: string) => void,
  ): void;

  export function toDataURL(
    text: string | Buffer,
    options: QRCodeRenderersOptions,
    callback: (error: Error | null | undefined, url: string) => void,
  ): void;

  export function toString(
    text: string | Buffer,
    options?: QRCodeRenderersOptions,
  ): Promise<string>;

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | Buffer,
    options?: QRCodeRenderersOptions,
  ): Promise<void>;
}
