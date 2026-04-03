<script lang="ts">
  import { Dot, Star } from "lucide-svelte";
  import Badge from "./ui/badge/badge.svelte";
  import type { Movie } from "$lib/api/tmdb";

  let { movie }: { movie: Movie } = $props();

  // Format runtime (e.g., 120 -> "2h 0m")
  let runtime = $derived(
    movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : "",
  );

  let releaseYear = $derived(movie.release_date?.split("-")[0] || "");
</script>

<div>
  <div class="mb-4 flex gap-2">
    <!-- TMDB doesn't have "addons", so we show the status or just Movie -->
    <Badge variant="default" class="text-sm font-medium">Movie</Badge>
    <Badge variant="outline" class="text-sm font-medium backdrop-blur-lg">
      TMDB
    </Badge>
  </div>

  <!-- Title Logo: Since TMDB doesn't have a logo field, we use a nice Title text -->
  <h1
    class="text-5xl font-bold text-white mb-4 [text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]"
  >
    {movie.title}
  </h1>

  <!-- Genres & Rating -->
  <div class="mt-4 flex gap-2 flex-wrap">
    {#each movie.genres as genre}
      <Badge
        variant="outline"
        class="px-4 py-1 backdrop-blur-lg bg-black/20 border-white/10"
      >
        {genre.name}
      </Badge>
    {/each}
    <Badge
      variant="outline"
      class="px-4 py-1 backdrop-blur-lg bg-black/20 border-white/10 flex items-center gap-1"
    >
      <Star class="h-4 w-4 text-yellow-400" fill="currentColor" />
      {movie.vote_average.toFixed(1)}
    </Badge>
  </div>

  <!-- Metadata Row -->
  <div class="my-6 flex w-full flex-col text-gray-200">
    <div class="flex items-center text-lg">
      <p>{runtime}</p>
      {#if releaseYear}
        <Dot class="h-6 w-6" />
        <p>{releaseYear}</p>
      {/if}
    </div>
  </div>

  <!-- Description -->
  <p
    class="mb-6 max-w-2xl text-gray-200 leading-relaxed text-lg [text-shadow:_0_1px_2px_rgb(0_0_0_/_50%)]"
  >
    {movie.overview}
  </p>
</div>
