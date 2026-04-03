<script lang="ts">
  import "flag-icons/css/flag-icons.min.css";
  import { parse } from "bcp-47";
  import Slider from "$lib/components/ui/slider/slider.svelte";
  import {
    AudioLines,
    Captions,
    CaptionsOff,
    Film,
    Hd,
    Loader,
    Loader2,
    Maximize,
    Minimize,
    Pause,
    Play,
    Volume1,
    Volume2,
    VolumeOff,
    X,
  } from "@lucide/svelte";
  import Seekbar from "./Seekbar.svelte";
  import Button from "./ui/button/button.svelte";
  import ScrollArea from "./ui/scroll-area/scroll-area.svelte";

  let {
    paused,
    volume,
    muted,
    currentTime,
    duration,
    buffered = 0,
    isBuffering = false,
    isLoading = false,
    subtitleTracks,
    audioTracks,
    selectedSubtitle,
    selectedAudioTrack,
    resolutions,
    currentResolutionStreams,
    selectedResolutionLabel,
    selectedStreamUrl,
    isFullscreen,
    setVolume,
    toggleMute,
    selectAudioTrack,
    selectSubtitleTrack,
    play,
    pause,
    seek,
    selectResolution,
    selectStream,
    toggleFullscreen,
  }: {
    paused: boolean;
    volume: number;
    muted: boolean;
    currentTime: number;
    duration: number;
    buffered?: number;
    isBuffering?: boolean;
    isLoading?: boolean;
    subtitleTracks: any[];
    audioTracks: any[];
    selectedSubtitle: string | null;
    selectedAudioTrack: string | null;
    resolutions: any[];
    currentResolutionStreams: any[];
    selectedResolutionLabel: string;
    selectedStreamUrl: string;
    isFullscreen: boolean;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    selectAudioTrack: (id: string) => void;
    selectSubtitleTrack: (id: string) => void;
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    selectResolution: (label: string) => void;
    selectStream: (url: string) => void;
    toggleFullscreen: () => void;
  } = $props();

  let isSettingsOpen = $state(false);
  let sections = ["Subtitles", "Audio", "Quality", "Source"];
  let activeSection = $state(sections[0]);

  function getTrackLabel(track: any, fallbackPrefix: string) {
    return track.title || track.lang || `${fallbackPrefix} ${track.id}`;
  }

  function sectionChange(section: string) {
    if (!isSettingsOpen) {
      isSettingsOpen = true;
    } else if (activeSection === section) {
      isSettingsOpen = false;
    }
    activeSection = section;
  }
</script>

<div class="relative w-full">
  {#if isSettingsOpen}
    <div
      class="fixed right-0 top-0 bottom-0 w-90 h-full bg-background border-l flex flex-col overflow-hidden z-50 shadow-2xl"
    >
      <div class="flex gap-2 p-2 shrink-0">
        <div
          class="border rounded-lg gap-1 flex p-1 flex-1 overflow-x-auto hide-scrollbar"
        >
          {#each sections as section}
            <Button
              variant={activeSection === section ? "default" : "ghost"}
              onclick={() => (activeSection = section)}
              class="px-2"
            >
              {section}
            </Button>
          {/each}
        </div>
        <div
          class="border rounded-full content-center items-center justify-center p-1"
        >
          <Button
            variant="ghost"
            size="icon"
            class="rounded-full"
            onclick={() => (isSettingsOpen = false)}
          >
            <X class="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div class="px-3 pb-3 flex-1 min-h-0 w-full">
        {#if activeSection === "Quality"}
          <ScrollArea class="h-full">
            <div class="flex flex-col gap-1 w-full pr-2">
              {#each resolutions as res}
                <Button
                  variant={selectedResolutionLabel === res.label
                    ? "default"
                    : "outline"}
                  class="w-full justify-start"
                  onclick={() => {
                    selectResolution(res.label);
                  }}
                >
                  {res.label === "Unknown"
                    ? "Unknown"
                    : res.label.toUpperCase()}
                </Button>
              {/each}
            </div>
          </ScrollArea>
        {:else if activeSection === "Source"}
          <ScrollArea class="h-full">
            <div class="flex flex-col gap-1 w-full pr-2">
              {#each currentResolutionStreams as stream}
                <Button
                  variant={selectedStreamUrl === stream.url
                    ? "default"
                    : "outline"}
                  class="w-full justify-start h-auto py-2 whitespace-normal text-left"
                  onclick={() => {
                    selectStream(stream.url);
                  }}
                >
                  {stream.name || "Unknown Source"}
                </Button>
              {/each}
            </div>
          </ScrollArea>
        {:else if activeSection === "Subtitles"}
          <Button
            variant={selectedSubtitle === "no" ? "default" : "outline"}
            class="w-full justify-start mb-2"
            onclick={() => {
              selectSubtitleTrack("no");
            }}
          >
            No Subtitles
          </Button>
          <ScrollArea class="h-full">
            <div class="flex flex-col gap-1 w-full pr-2">
              {#each subtitleTracks as track}
                <Button
                  variant={selectedSubtitle === track.id.toString()
                    ? "default"
                    : "outline"}
                  class="w-full justify-start"
                  onclick={() => {
                    selectSubtitleTrack(track.id.toString());
                  }}
                >
                  <span
                    class="fi fi-{parse(track.lang || 'en', {
                      normalize: true,
                      forgiving: true,
                    }).region?.toLowerCase()}"
                  ></span>
                  <span class="ml-2 truncate"
                    >{getTrackLabel(track, "Subtitle")}</span
                  >
                </Button>
              {/each}
            </div>
          </ScrollArea>
        {:else if activeSection === "Audio"}
          <ScrollArea class="h-full">
            <div class="flex flex-col gap-1 w-full pr-2">
              {#each audioTracks as track}
                <Button
                  variant={selectedAudioTrack === track.id.toString()
                    ? "default"
                    : "outline"}
                  class="w-full justify-start"
                  onclick={() => {
                    selectAudioTrack(track.id.toString());
                  }}
                >
                  <span
                    class="fi fi-{parse(track.lang || 'en', {
                      normalize: true,
                      forgiving: true,
                    }).region?.toLowerCase()}"
                  ></span>
                  <span class="ml-2 truncate"
                    >{getTrackLabel(track, "Audio")}</span
                  >
                </Button>
              {/each}
            </div>
          </ScrollArea>
        {/if}
      </div>
    </div>
  {/if}

  <Seekbar
    time={currentTime}
    {duration}
    {buffered}
    updateTime={(newTime) => seek(newTime)}
  />

  <div class="flex items-center justify-between text-white mt-4">
    <div class="flex items-center gap-4">
      <button
        onclick={() => (paused ? play() : pause())}
        class="rounded-full p-2 transition-colors hover:bg-white/10"
      >
        {#if isLoading || isBuffering}
          <Loader class="h-6 w-6 animate-spin" />
        {:else if paused}
          <Play class="h-6 w-6 " />
        {:else}
          <Pause class="h-6 w-6" />
        {/if}
      </button>

      <div class="group flex items-center gap-3">
        <button
          onclick={() => toggleMute()}
          class="rounded-full p-2 transition-colors hover:bg-white/10"
        >
          {#if muted || volume === 0}
            <VolumeOff class="h-5 w-5" />
          {:else if volume < 50}
            <Volume1 class="h-5 w-5" />
          {:else}
            <Volume2 class="h-5 w-5" />
          {/if}
        </button>

        <div class="w-24">
          <Slider
            type="single"
            value={volume}
            max={100}
            onValueChange={(v) => setVolume(v as number)}
          />
        </div>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <button
        class="rounded-full p-2 transition-colors hover:bg-white/10"
        onclick={() => sectionChange("Subtitles")}
      >
        {#if selectedSubtitle && selectedSubtitle !== "no"}
          <Captions />
        {:else}
          <CaptionsOff />
        {/if}
      </button>

      <button
        class="rounded-full p-2 transition-colors hover:bg-white/10"
        onclick={() => sectionChange("Audio")}
      >
        <AudioLines />
      </button>

      <button
        class="rounded-full p-2 transition-colors hover:bg-white/10"
        onclick={() => sectionChange("Quality")}
      >
        <Hd />
      </button>

      <button
        class="rounded-full p-2 transition-colors hover:bg-white/10"
        onclick={() => sectionChange("Source")}
      >
        <Film />
      </button>

      <button
        class="rounded-full p-2 transition-colors hover:bg-white/10"
        onclick={() => toggleFullscreen()}
      >
        {#if isFullscreen}
          <Minimize />
        {:else}
          <Maximize />
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>
