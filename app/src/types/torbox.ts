export interface AddonStream {
  name?: string;
  title?: string;
  description?: string;
  url?: string;
  infoHash?: string;
  fileIdx?: number;
  magnetLink?: string;
  addonUrl?: string;
  behaviorHints?: {
    filename?: string;
    videoSize?: number;
  };
}

export interface AddonStreamResponse {
  streams: AddonStream[];
}

export type Resolution = '4K' | '1080p' | '720p' | 'SD' | 'Unknown';

export interface EnrichedStream extends AddonStream {
  parsedTitle: string;
  rawName: string;
  resolution: Resolution;
  sizeBytes?: number;
  seeders?: number;
  cached: boolean;
  parsedCodec?: string;
  parsedAudio?: string;
  parsedQuality?: string;
}

export interface TorBoxCachedFile {
  name: string;
  size: number;
  id: number;
}

export interface TorBoxCachedItem {
  name: string;
  size: number;
  hash: string;
  files?: TorBoxCachedFile[];
}

export interface TorBoxCacheCheckResponse {
  success: boolean;
  data: Record<string, TorBoxCachedItem | undefined>;
}

export interface TorBoxCreateTorrentResponse {
  success: boolean;
  detail?: string;
  error?: string;
  data: { torrent_id: number } | null;
}

export interface TorBoxControlTorrentResponse {
  success: boolean;
}

export interface TorBoxRequestDlResponse {
  data: string;
}

export interface TorBoxTorrentFile {
  id: number;
  name: string;
  size: number;
  mimetype?: string;
  short_name?: string;
}

export interface TorBoxTorrentItem {
  id: number;
  hash: string;
  name: string;
  download_state: string;
  cached?: boolean;
  files?: TorBoxTorrentFile[];
  progress?: number;
  download_speed?: number;
  seeds?: number;
  peers?: number;
  eta?: number;
}

// ?id=N returns a single object; no id returns an array
export interface TorBoxListResponse {
  success: boolean;
  data: TorBoxTorrentItem[] | TorBoxTorrentItem | null;
}

export interface TorBoxUserResponse {
  success: boolean;
  data: {
    id: number;
    email: string;
    plan: number; // 0=free, 1=essential, 2=pro, 3=standard
  };
}

