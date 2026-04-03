<script lang="ts">
  import type { Movie } from "tmdb-ts";

  let { trending }: { trending: any } = $props();

  // Dynamically get the first movie when the data loads
  let bannerMovie = $derived(trending.data?.results?.[0] as Movie | undefined);
</script>

<div
  class="relative w-full aspect-video md:aspect-[21/9] rounded-xl overflow-hidden shadow-lg bg-[var(--muted)]"
>
  <!-- Background Image -->
  {#if bannerMovie?.backdrop_path}
    <img
      src={`https://image.tmdb.org/t/p/original${bannerMovie.backdrop_path}`}
      alt={bannerMovie.title}
      class="absolute inset-0 w-full h-full object-cover"
    />
  {/if}

  <!-- Netflix-style Gradient Overlays -->
  <div
    class="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)/20] to-transparent"
  ></div>
  <div
    class="absolute inset-0 bg-gradient-to-r from-[var(--background)] via-[var(--background)/40] to-transparent w-3/4"
  ></div>

  <!-- Content -->
  <div class="absolute bottom-0 left-0 p-6 md:p-12 lg:p-16 w-full md:w-2/3">
    {#if trending.isPending}
      <div class="w-64 h-10 bg-[var(--muted)] animate-pulse rounded mb-4"></div>
      <div class="w-full h-16 bg-[var(--muted)] animate-pulse rounded"></div>
    {:else if bannerMovie}
      <h2
        class="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-md tracking-tight"
      >
        {bannerMovie.title || bannerMovie.original_title}
      </h2>
      <p
        class="text-sm md:text-lg text-gray-200 line-clamp-3 md:line-clamp-4 drop-shadow"
      >
        {bannerMovie.overview}
      </p>
    {/if}
  </div>
</div>
