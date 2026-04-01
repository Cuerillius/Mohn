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
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { onDestroy, onMount } from "svelte";

  import VideoControlles from "$lib/components/VideoControlles.svelte";

  interface MpvTrack {
    id: number;
    type: "video" | "audio" | "sub";
    title?: string;
    lang?: string;
    codec?: string;
    selected?: boolean;
  }

  interface Stream {
    name: string;
    url: string;
  }

  interface Resolution {
    label: string;
    streams: Stream[];
  }

  let { params }: PageProps = $props();

  let streams: Stream[] = $state([]);
  let audioTracks: MpvTrack[] = $state([]);
  let subtitleTracks: MpvTrack[] = $state([]);

  let selectedResolutionLabel = $state("");
  let selectedStreamUrl = $state("");
  let currentAid = $state("auto");
  let currentSid = $state("no");

  let pauseState = $state(false);
  let timePos = $state(0);
  let duration = $state(0);
  let volume = $state(100);
  let muted = $state(false);

  // Loading & Buffering States
  let isLoading = $state(true);
  let isBuffering = $state(false);
  let buffered = $state(0);

  // Internal states to calculate correct buffering visually
  let coreIdle = $state(false);
  let pausedForCache = $state(false);

  let showUI = $state(true);
  let isFullscreen = $state(false);
  let uiTimeout: ReturnType<typeof setTimeout>;

  let resolution = $derived(extractResolutions(streams));
  let currentResolutionStreams = $derived(
    resolution.find((r) => r.label === selectedResolutionLabel)?.streams || [],
  );

  let unlistenProperties: (() => void) | null = $state(null);

  const OBSERVED_PROPERTIES = [
    ["pause", "flag"],
    ["time-pos", "double", "none"],
    ["duration", "double", "none"],
    ["track-list", "node", "none"],
    ["aid", "string", "none"],
    ["sid", "string", "none"],
    ["volume", "double", "none"],
    ["mute", "flag"],
    ["paused-for-cache", "flag"],
    ["core-idle", "flag"],
    ["demuxer-cache-duration", "double", "none"],
  ] as const satisfies MpvObservableProperty[];

  function extractResolutions(streams: Stream[]): Resolution[] {
    const resMap: Record<string, Stream[]> = {};
    for (const stream of streams) {
      const match = stream.name.match(/(4[kK]|\d{3,4}p)/);
      const label = match ? match[1].toLowerCase() : "Unknown";
      if (!resMap[label]) resMap[label] = [];
      resMap[label].push(stream);
    }
    return Object.entries(resMap)
      .map(([label, streams]) => ({ label, streams }))
      .sort((a, b) => {
        const valA = a.label === "4k" ? 2160 : parseInt(a.label) || 0;
        const valB = b.label === "4k" ? 2160 : parseInt(b.label) || 0;
        return valB - valA;
      });
  }

  function handleMouseMove() {
    showUI = true;
    clearTimeout(uiTimeout);
    uiTimeout = setTimeout(() => {
      if (!pauseState) showUI = false;
    }, 3000);
  }

  function updateBufferingState() {
    if (isLoading) return;
    const isAtEnd = duration > 0 && timePos >= duration - 1;
    isBuffering = (pausedForCache || (coreIdle && !pauseState)) && !isAtEnd;
  }

  // --- Keyboard Shortcuts Handler ---
  function handleKeydown(e: KeyboardEvent) {
    // Prevent shortcut triggering if the user is typing in an input or textarea
    const target = e.target as HTMLElement;
    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.isContentEditable
    ) {
      return;
    }

    let handled = true;

    switch (e.key) {
      case " ":
        if (pauseState) playVideo();
        else pauseVideo();
        break;
      case "ArrowRight":
        seekVideo(Math.min(duration, timePos + 5)); // Seek forward 5s
        break;
      case "ArrowLeft":
        seekVideo(Math.max(0, timePos - 5)); // Seek backward 5s
        break;
      case "f":
      case "F":
        toggleFullscreen();
        break;
      case "m":
      case "M":
        handleToggleMute();
        break;
      case ".": // Period: Frame Forward
        command("frame-step").catch(console.error);
        break;
      case ",": // Comma: Frame Back
        command("frame-back-step").catch(console.error);
        break;
      default:
        handled = false;
        break;
    }

    if (handled) {
      e.preventDefault(); // Prevent default browser behaviors (like space scrolling)
      handleMouseMove(); // Bring up the UI briefly so the user sees the changes
    }
  }

  onMount(async () => {
    try {
      const mpvConfig: MpvConfig = {
        initialOptions: {
          vo: "gpu-next",
          hwdec: "auto-safe",
          "keep-open": "yes",
          "force-window": "yes",
          "video-unscaled": "no",
        },
        observedProperties: OBSERVED_PROPERTIES,
      };

      await init(mpvConfig);
      document.documentElement.classList.add("player-page");
      document.body.classList.add("player-page");
      unlistenProperties = await observeProperties(
        OBSERVED_PROPERTIES,
        ({ name, data }) => {
          if (name === "pause") {
            pauseState = !!data;
            updateBufferingState();
          } else if (name === "time-pos") {
            timePos = (data as number) || 0;
            if (isLoading && timePos > 0.5) isLoading = false;
            updateBufferingState();
          } else if (name === "duration") {
            duration = (data as number) || 0;
          } else if (name === "aid") {
            currentAid = (data ?? "auto").toString();
          } else if (name === "sid") {
            currentSid = (data ?? "no").toString();
          } else if (name === "volume") {
            volume = (data as number) || 0;
          } else if (name === "mute") {
            muted = !!data;
          } else if (name === "paused-for-cache") {
            pausedForCache = !!data;
            updateBufferingState();
          } else if (name === "core-idle") {
            coreIdle = !!data;
            updateBufferingState();
          } else if (name === "demuxer-cache-duration") {
            const cacheDuration = (data as number) || 0;
            buffered = timePos + cacheDuration;
          } else if (name === "track-list") {
            const tracks = (data as MpvTrack[]) || [];
            audioTracks = tracks.filter((t) => t.type === "audio");
            subtitleTracks = tracks.filter((t) => t.type === "sub");
          }
        },
      );
    } catch (error) {
      console.error("Failed to initialize MPV:", error);
    }

    try {
      const result = await invoke<{ streams: Stream[] }>("get_streams", {
        manifest: "",
        mediaType: params.type,
        id: params.id,
      });
      streams = result.streams;

      const initialResolutions = extractResolutions(streams);
      if (initialResolutions.length > 0) {
        selectedResolutionLabel = initialResolutions[0].label;
        if (initialResolutions[0].streams.length > 0) {
          selectedStreamUrl = initialResolutions[0].streams[0].url;
          await playStream(selectedStreamUrl);
        }
      }
    } catch (error) {
      console.error("Failed to fetch streams:", error);
      isLoading = false;
    }

    handleMouseMove();
  });

  onDestroy(async () => {
    clearTimeout(uiTimeout);
    unlistenProperties?.();
    await destroy();
    document.documentElement.classList.remove("player-page");
    document.body.classList.remove("player-page");
  });

  async function playStream(url: string, startTime: number = 0) {
    if (!url) return;
    try {
      isLoading = true;
      isBuffering = false;
      buffered = 0;

      if (startTime > 0) {
        await command("loadfile", [url, "replace", `start=${startTime}`]);
      } else {
        await command("loadfile", [url]);
      }
    } catch (e) {
      console.error("Failed to play file:", e);
      isLoading = false;
    }
  }

  async function playVideo() {
    await setProperty("pause", false).catch(console.error);
  }
  async function pauseVideo() {
    await setProperty("pause", true).catch(console.error);
  }

  async function seekVideo(time: number) {
    await setProperty("time-pos", time).catch(console.error);
  }

  async function handleSetVolume(val: number) {
    await setProperty("volume", val).catch(console.error);
  }
  async function handleToggleMute() {
    await setProperty("mute", !muted).catch(console.error);
  }

  async function selectResolution(label: string) {
    selectedResolutionLabel = label;
    const matchedRes = resolution.find((r) => r.label === label);
    if (matchedRes && matchedRes.streams.length > 0) {
      selectedStreamUrl = matchedRes.streams[0].url;
      await playStream(selectedStreamUrl, timePos);
    }
  }

  async function selectStream(url: string) {
    selectedStreamUrl = url;
    await playStream(url, timePos);
  }

  async function selectAudioTrack(aid: string) {
    await setProperty("aid", aid).catch(console.error);
  }
  async function selectSubtitle(sid: string) {
    await setProperty("sid", sid).catch(console.error);
  }

  async function toggleFullscreen() {
    try {
      const appWindow = getCurrentWindow();
      isFullscreen = !isFullscreen;
      await appWindow.setFullscreen(isFullscreen);
    } catch (e) {
      console.error("Failed to toggle fullscreen:", e);
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="relative w-full h-screen bg-transparent overflow-hidden group"
  onmousemove={handleMouseMove}
  onmouseleave={() => (showUI = false)}
  role="presentation"
>
  <div
    class="absolute inset-0 z-50 pointer-events-none flex flex-col justify-end transition-opacity duration-300 {showUI ||
    pauseState
      ? 'opacity-100'
      : 'opacity-0'}"
  >
    <div
      class="pointer-events-auto w-full bg-linear-to-t from-black/90 via-black/40 to-transparent px-6 pb-6 pt-16"
    >
      <VideoControlles
        paused={pauseState}
        {volume}
        {muted}
        currentTime={timePos}
        {duration}
        {buffered}
        {isBuffering}
        {isLoading}
        {subtitleTracks}
        {audioTracks}
        selectedSubtitle={currentSid}
        selectedAudioTrack={currentAid}
        resolutions={resolution}
        {currentResolutionStreams}
        {selectedResolutionLabel}
        {selectedStreamUrl}
        {isFullscreen}
        setVolume={handleSetVolume}
        toggleMute={handleToggleMute}
        {selectAudioTrack}
        selectSubtitleTrack={selectSubtitle}
        play={playVideo}
        pause={pauseVideo}
        seek={seekVideo}
        {selectResolution}
        {selectStream}
        {toggleFullscreen}
      />
    </div>
  </div>
</div>
