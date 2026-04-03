<script lang="ts">
  import { goto } from "$app/navigation";
  import type { Movie } from "tmdb-ts";
  import Poster from "./Poster.svelte";

  let {
    title,
    movies,
    isLoading = false,
  }: {
    title: string;
    movies: Movie[] | undefined;
    isLoading?: boolean;
  } = $props();
</script>

<div class="space-y-3">
  <h3
    class="text-lg md:text-xl font-medium text-[var(--foreground)] px-4 md:px-0"
  >
    {title}
  </h3>

  <!-- Scroll container -->
  <div
    class="flex gap-3 md:gap-4 overflow-x-auto pb-4 px-4 md:px-0 snap-x snap-mandatory hide-scrollbar"
  >
    {#if isLoading}
      {#each Array(8) as _}
        <!-- Poster Skeleton -->
        <div
          class="w-28 sm:w-32 md:w-40 aspect-[2/3] rounded-lg bg-[var(--muted)] animate-pulse flex-shrink-0 snap-start"
        ></div>
      {/each}
    {:else if movies && movies.length > 0}
      {#each movies as movie}
        <!-- Poster Card -->
        <Poster {movie} />
      {/each}
    {:else}
      <p class="text-[var(--muted-foreground)] px-4 md:px-0">
        No movies found.
      </p>
    {/if}
  </div>
</div>

<style>
  /* Hide scrollbar for Chrome, Safari and Opera */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  /* Hide scrollbar for IE, Edge and Firefox */
  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
