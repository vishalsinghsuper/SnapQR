/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EventConfig {
  eventName: string;
  eventDate: string;
  eventLogo: string; // Base64 or local URL
  customWatermark: string;
  enabledCustomizations: {
    frames: boolean;
    stickers: boolean;
    text: boolean;
    filters: boolean;
  };
}

export interface PhotoRecord {
  id: string;
  createdAt: string; // ISO string
  frameId: string;
  themeId: string;
  downloadCount: number;
  scanCount: number;
}

export interface AnalyticsData {
  totalPhotosTaken: number;
  totalQrScans: number;
  totalDownloads: number;
  frameUsage: Record<string, number>;
  themeUsage: Record<string, number>;
}

export interface Sticker {
  id: string;
  type: string; // emoji, prebuilt, etc.
  content: string; // emoji character or svg path or URL
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale: number; // multiplier, e.g. 1.0
  rotation: number; // degrees
}

export interface PhotoStripSettings {
  frameColor: string; // hex
  themeId: string; // e.g. 'retro', 'neon', 'festival', 'classic'
  stickers: Sticker[];
  customText: string;
  textColor: string;
  showDateTime: boolean;
  filterId: string; // 'none', 'grayscale', 'sepia', 'vintage', 'warm', 'cool'
  layoutId?: string;
  fontId?: string;
}

export interface PhotoBoothState {
  photos: string[]; // Base64 data URLs
  settings: PhotoStripSettings;
  generatedStripUrl: string | null;
  qrCodeUrl: string | null;
  photoId: string | null;
}
