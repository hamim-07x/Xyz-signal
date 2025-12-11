
export interface PredictionResult {
  number: number;
  size: 'Small' | 'Big';
  color: 'Red' | 'Green' | 'Violet';
}

export interface HistoryItem {
  period: string;
  result: PredictionResult;
  timestamp: string;
}

export type GameMode = 'WINGO 30S' | 'WINGO 1M' | 'WINGO 3M' | 'WINGO 5M';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface UserData {
  telegramId: number;
  username: string;
  licenseExpiry: number; // Timestamp
  isBanned: boolean;
  lastLogin: string;
}

export interface LicenseKey {
  key: string;
  durationHours: number; // Stored as hours for display, but logic uses ms
  durationMs: number;    // Actual duration in milliseconds
  isUsed: boolean;
  usedBy?: number; // Telegram ID
  createdAt: number;
  activatedAt?: number; // When the key was actually used
}

export interface GlobalSettings {
  appName?: string;
  channelLink: string;
  contactLink: string;
  strictMode: boolean; // Toggle for API Verification
  botToken?: string;   // For Real API Check
  channelChatId?: string; // For Real API Check
  adminImageUrl?: string;
}

export interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onClearHistory: () => void;
}
