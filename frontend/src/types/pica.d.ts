declare module "pica" {
  interface PicaResizeOptions {
    quality?: number;
    alpha?: boolean;
    unsharpAmount?: number;
    unsharpRadius?: number;
    unsharpThreshold?: number;
    cancelToken?: object;
  }

  interface PicaInstance {
    resize: (
      from: HTMLImageElement | HTMLCanvasElement,
      to: HTMLCanvasElement,
      options?: PicaResizeOptions,
    ) => Promise<HTMLCanvasElement>;
    toBlob: (
      canvas: HTMLCanvasElement,
      mimeType?: string,
      quality?: number,
    ) => Promise<Blob>;
  }

  interface PicaOptions {
    features?: string[];
  }

  interface PicaConstructor {
    new (options?: PicaOptions): PicaInstance;
  }

  const Pica: PicaConstructor;
  export default Pica;
}
