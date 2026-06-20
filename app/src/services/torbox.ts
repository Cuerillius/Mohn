import type {
  TorBoxCacheCheckResponse,
  TorBoxControlTorrentResponse,
  TorBoxCreateTorrentResponse,
  TorBoxListResponse,
  TorBoxPlan,
  TorBoxRequestDlResponse,
  TorBoxTorrentFile,
  TorBoxTorrentItem,
  TorBoxUserResponse,
} from "../types/torbox";

export class SlotsFullError extends Error {
  constructor() {
    super("ACTIVE_LIMIT");
    this.name = "SlotsFullError";
  }
}

const BASE = `${import.meta.env.VITE_GATEKEEPER_URL}/api/torbox`;

async function torboxGet<T>(path: string): Promise<T> {
  const url = `${BASE}${path}`;
  console.log("[torbox] GET", url);
  const res = await fetch(url, { credentials: "include" });
  console.log("[torbox] GET response", res.status, url);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    console.error("[torbox] GET error", res.status, text);
    throw new Error(`TorBox ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function torboxPostForm<T>(path: string, body: FormData): Promise<T> {
  const url = `${BASE}${path}`;
  console.log("[torbox] POST form", url);
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    body,
  });
  console.log("[torbox] POST form response", res.status, url);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    console.error("[torbox] POST form error", res.status, text);
    throw new Error(`TorBox ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function torboxPostJson<T>(path: string, body: unknown): Promise<T> {
  const url = `${BASE}${path}`;
  console.log("[torbox] POST json", url);
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  console.log("[torbox] POST json response", res.status, url);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    console.error("[torbox] POST json error", res.status, text);
    throw new Error(`TorBox ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// Uses POST body form per spec: { hashes: string[] }
export async function checkCached(
  hashes: string[],
): Promise<TorBoxCacheCheckResponse> {
  return torboxPostJson<TorBoxCacheCheckResponse>(
    "/torrents/checkcached?format=object",
    { hashes },
  );
}

export async function createTorrent(
  magnet: string,
): Promise<TorBoxCreateTorrentResponse> {
  const fd = new FormData();
  fd.append("magnet", magnet);
  const res = await torboxPostForm<TorBoxCreateTorrentResponse>(
    "/torrents/createtorrent",
    fd,
  );
  if (
    !res.success &&
    (res.detail === "ACTIVE_LIMIT" || res.error === "ACTIVE_LIMIT")
  ) {
    throw new SlotsFullError();
  }
  if (!res.success || !res.data) {
    throw new Error(res.error ?? res.detail ?? "Failed to create torrent");
  }
  // data is non-null here — the guard above throws if it's falsy
  return res as typeof res & { data: NonNullable<typeof res.data> };
}

export async function listTorrents(): Promise<TorBoxTorrentItem[]> {
  const res = await torboxGet<TorBoxListResponse>(
    "/torrents/mylist?bypass_cache=true",
  );
  if (!res.data) return [];
  return Array.isArray(res.data) ? res.data : [res.data];
}

export async function deleteTorrent(torrentId: number): Promise<void> {
  await torboxPostJson<TorBoxControlTorrentResponse>(
    "/torrents/controltorrent",
    {
      torrent_id: torrentId,
      operation: "delete",
    },
  );
}

export async function getTorrent(
  torrentId: number,
): Promise<TorBoxListResponse> {
  return torboxGet<TorBoxListResponse>(
    `/torrents/mylist?id=${torrentId}&bypass_cache=true`,
  );
}

// requestdl auth is via token query param only (no Bearer) — gatekeeper injects it
export async function requestDownloadLink(
  torrentId: number,
  fileId: number,
): Promise<TorBoxRequestDlResponse> {
  const params = new URLSearchParams({
    torrent_id: String(torrentId),
    file_id: String(fileId),
  });
  return torboxGet<TorBoxRequestDlResponse>(`/torrents/requestdl?${params}`);
}

export async function createAndResolveLink(
  magnet: string,
  fileIdx: number | undefined,
): Promise<{
  torrentId: number;
  fileId: number;
  url: string;
  mimetype?: string;
}> {
  const created = await createTorrent(magnet);
  const torrentId = created.data!.torrent_id;

  console.log("[torbox] polling torrent", torrentId);
  let files: TorBoxTorrentFile[] | undefined;
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    try {
      const list = await getTorrent(torrentId);
      // ?id=N returns a single object, not an array
      const item = Array.isArray(list.data) ? list.data[0] : list.data;
      console.log(
        `[torbox] poll ${i + 1}/20 torrent`,
        torrentId,
        "files:",
        item?.files?.length ?? 0,
        "state:",
        item?.download_state,
      );
      if (item?.files && item.files.length > 0) {
        files = item.files;
        break;
      }
    } catch (err) {
      console.log(`[torbox] poll ${i + 1}/20 not ready yet:`, err);
    }
  }

  if (!files || files.length === 0) {
    console.error("[torbox] torrent", torrentId, "not ready after 20 polls");
    throw new Error("Torrent not ready, try again");
  }

  // Prefer video files when auto-selecting the largest
  const videoFiles = files.filter((f) => f.mimetype?.startsWith("video/"));
  const candidates = videoFiles.length > 0 ? videoFiles : files;

  const file =
    fileIdx !== undefined && files[fileIdx]
      ? files[fileIdx]
      : candidates.reduce((a, b) => (b.size > a.size ? b : a));

  console.log("[torbox] selected file", file.id, file.name, file.mimetype);
  const dlRes = await requestDownloadLink(torrentId, file.id);
  return {
    torrentId,
    fileId: file.id,
    url: dlRes.data,
    mimetype: file.mimetype,
  };
}

export async function fetchTorboxPlan(): Promise<TorBoxPlan> {
  const res = await torboxGet<TorBoxUserResponse>("/user/me");
  return (res.data?.plan ?? 0) as TorBoxPlan;
}

export function pollTorrentProgress(
  torrentId: number,
  onUpdate: (item: import("../types/torbox").TorBoxTorrentItem) => void,
  intervalMs = 2000,
): () => void {
  let cancelled = false;
  async function poll() {
    if (cancelled) return;
    try {
      const list = await getTorrent(torrentId);
      const item = Array.isArray(list.data) ? list.data[0] : list.data;
      if (item) onUpdate(item);
    } catch {
      // ignore poll errors
    }
    if (!cancelled) setTimeout(poll, intervalMs);
  }
  poll();
  return () => {
    cancelled = true;
  };
}
