<script lang="ts">
  import type {
    MpvObservableProperty,
    MpvConfig,
  } from "tauri-plugin-libmpv-api";
  import {
    init,
    observeProperties,
    destroy,
    command,
    setProperty,
  } from "tauri-plugin-libmpv-api";
  import type { PageProps } from "./$types";
  import { invoke } from "@tauri-apps/api/core";
  import { onDestroy, onMount } from "svelte";

  interface MpvTrack {
    id: number;
    type: "video" | "audio" | "sub";
    title?: string;
    lang?: string;
    codec?: string;
    selected?: boolean;
  }

  let { params }: PageProps = $props();

  let streams: { streams: Array<{ name: string; url: string }> } = $state({
    streams: [],
  });
  let url = $state("");
  let externalSubUrl = $state("");

  let pause = $state(false);
  let timePos = $state(0);
  let duration = $state(0);

  let audioTracks: MpvTrack[] = $state([]);
  let subtitleTracks: MpvTrack[] = $state([]);
  let currentAid = $state("auto");
  let currentSid = $state("no");

  let unlistenProperties: (() => void) | null = $state(null);

  const OBSERVED_PROPERTIES = [
    ["pause", "flag"],
    ["time-pos", "double", "none"],
    ["duration", "double", "none"],
    ["filename", "string", "none"],
    ["track-list", "node", "none"],
    ["aid", "string", "none"],
    ["sid", "string", "none"],
  ] as const satisfies MpvObservableProperty[];

  onMount(async () => {
    const mpvConfig: MpvConfig = {
      initialOptions: {
        vo: "gpu-next",
        hwdec: "auto-safe",
        "keep-open": "yes",
        "force-window": "yes",
      },
      observedProperties: OBSERVED_PROPERTIES,
    };

    try {
      await init(mpvConfig);
      unlistenProperties = await observeProperties(
        OBSERVED_PROPERTIES,
        ({ name, data }) => {
          if (name === "pause") pause = !!data;
          else if (name === "time-pos") timePos = (data as number) || 0;
          else if (name === "duration") duration = (data as number) || 0;
          else if (name === "aid") currentAid = (data ?? "auto").toString();
          else if (name === "sid") currentSid = (data ?? "no").toString();
          else if (name === "track-list") {
            const tracks = (data as MpvTrack[]) || [];
            audioTracks = tracks.filter((t) => t.type === "audio");
            subtitleTracks = tracks.filter((t) => t.type === "sub");
          }
        },
      );
    } catch (error) {
      console.error("Failed to initialize mpv or observe properties:", error);
    }

    try {
      streams = await invoke<{ streams: Array<{ name: string; url: string }> }>(
        "get_streams",
        {
          manifest:
            "https://aiostreams.elfhosted.com/stremio/69e974b2-bac1-43cb-ad73-b538f5aff622/eyJpIjoiSnNGNjVucUpxYmhvWkJmNURST0Zqdz09IiwiZSI6IjlHSFB0QjZUUlJkc3FpSmlYR2N2ZmF5SkhFS2dFUXFHYmd3RTNheXBveTg9IiwidCI6ImEifQ/manifest.json",
          mediaType: params.type,
          id: params.id,
        },
      );
    } catch (error) {
      console.error("Failed to fetch streams:", error);
    }
  });

  onDestroy(async () => {
    unlistenProperties?.();
    await destroy();
  });

  async function playUrl(e?: Event) {
    e?.preventDefault();
    if (!url) return;
    try {
      await command("loadfile", [url]);
    } catch (error) {
      console.error("Failed to play URL:", error);
    }
  }

  async function togglePause() {
    try {
      await setProperty("pause", !pause);
    } catch (error) {
      console.error("Failed to toggle pause:", error);
    }
  }

  async function handleSeek(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    try {
      await setProperty("time-pos", val);
    } catch (error) {
      console.error("Failed to seek:", error);
    }
  }

  async function changeAudioTrack(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    await setProperty("aid", val);
  }

  async function changeSubtitleTrack(e: Event) {
    const val = (e.target as HTMLSelectElement).value;
    await setProperty("sid", val);
  }

  async function addExternalSubtitle(e: Event) {
    e.preventDefault();
    if (!externalSubUrl) return;
    try {
      await command("sub-add", [externalSubUrl]);
      externalSubUrl = "";
    } catch (error) {
      console.error("Failed to load subtitle:", error);
    }
  }

  function formatTime(secs: number) {
    if (!secs || isNaN(secs)) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const mmss = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return h > 0 ? `${h}:${mmss}` : mmss;
  }
</script>

<main class="container">
  <form class="load-form" onsubmit={playUrl}>
    <input id="url-input" placeholder="Enter a Video URL..." bind:value={url} />
    <button type="submit">Play URL</button>
  </form>

  <div class="player-controls">
    <div class="progress-bar">
      <span>{formatTime(timePos)}</span>
      <input
        type="range"
        min="0"
        max={duration > 0 ? duration : 100}
        step="1"
        value={timePos}
        onchange={handleSeek}
        disabled={duration === 0}
      />
      <span>{formatTime(duration)}</span>
    </div>

    <div class="controls-row">
      <button type="button" onclick={togglePause}>
        {pause ? "▶ Resume" : "⏸ Pause"}
      </button>

      <div class="setting-group">
        <label for="audio-select">Audio:</label>
        <select
          id="audio-select"
          bind:value={currentAid}
          onchange={changeAudioTrack}
        >
          <option value="auto">Auto</option>
          <option value="no">None</option>
          {#each audioTracks as track}
            <option value={track.id.toString()}>
              {track.lang || track.title || `Track ${track.id}`}
              {track.codec ? `(${track.codec})` : ""}
            </option>
          {/each}
        </select>
      </div>

      <div class="setting-group">
        <label for="sub-select">Subtitle:</label>
        <select
          id="sub-select"
          bind:value={currentSid}
          onchange={changeSubtitleTrack}
        >
          <option value="no">None</option>
          <option value="auto">Auto</option>
          {#each subtitleTracks as track}
            <option value={track.id.toString()}>
              {track.lang || track.title || `Track ${track.id}`}
            </option>
          {/each}
        </select>
      </div>
    </div>

    <form class="sub-form" onsubmit={addExternalSubtitle}>
      <input
        placeholder="External Subtitle URL (.srt, .vtt)"
        bind:value={externalSubUrl}
      />
      <button type="submit">+ Add Sub</button>
    </form>
  </div>

  <hr />

  <div class="streams-container">
    <h2>Available Streams:</h2>
    <section class="streams-list">
      {#each streams.streams as stream}
        <button
          type="button"
          class="stream-btn"
          onclick={() => {
            url = stream.url;
            playUrl();
          }}
        >
          {stream.name}
        </button>
      {/each}
    </section>
  </div>
</main>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
    font-family: sans-serif;
  }

  .load-form,
  .sub-form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .load-form input,
  .sub-form input {
    flex: 1;
    padding: 0.5rem;
  }

  .player-controls {
    background: #1e1e1e;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .progress-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.9rem;
  }

  .progress-bar input[type="range"] {
    flex: 1;
    cursor: pointer;
  }

  .controls-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }

  .setting-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .setting-group select {
    padding: 0.25rem 0.5rem;
    background: #333;
    color: white;
    border: 1px solid #555;
    border-radius: 4px;
  }

  hr {
    margin: 2rem 0;
    border: none;
    border-top: 1px solid #ccc;
  }

  .streams-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .stream-btn {
    padding: 0.5rem;
    background: #f0f0f0;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    text-align: left;
  }

  .stream-btn:hover {
    background: #e0e0e0;
  }
</style>
