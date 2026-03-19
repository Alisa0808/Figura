export interface ProcessedImage {
  original: string;
  processed: string;
  id: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export enum ModelType {
  NANO_BANANA_PRO = 'google/nano-banana-pro/edit',
  NANO_BANANA_2 = 'google/nano-banana-2/edit'
}

export interface GenerationConfig {
  aspectRatio: string;
  imageSize: string;
}