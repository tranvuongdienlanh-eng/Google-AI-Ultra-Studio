
export enum TaskStatus {
  PENDING = 'PENDING',
  GENERATING_IMAGE = 'GENERATING_IMAGE',
  WAITING_VIDEO = 'WAITING_VIDEO', // Delay between image and video
  GENERATING_VIDEO = 'GENERATING_VIDEO',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  STOPPED = 'STOPPED'
}

export interface Task {
  id: string;
  projectName: string; // Used for filename
  imagePrompt: string;
  videoPrompt: string;
  status: TaskStatus;
  imageData?: string; // Base64
  imageMimeType?: string;
  videoUri?: string; // Download link
  videoUrl?: string; // Display/Download URL (with key)
  log?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'CHARACTER' | 'CONTEXT';
  data: string; // Base64
}

export interface AppSettings {
  delay: number; // Seconds
  engine: string;
  aspectRatio: string;
  resolution: string;
  filePrefix: string; // Used for filenames
  
  // Asset Library
  assets: Asset[];
  selectedCharacterId?: string;
  selectedContextId?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  delay: 10,
  engine: 'gemini-3-pro-image-preview', // High quality for base image
  aspectRatio: '16:9',
  resolution: '720p',
  filePrefix: 'duan',
  
  assets: [],
  selectedCharacterId: undefined,
  selectedContextId: undefined
};
