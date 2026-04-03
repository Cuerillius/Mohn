<script lang="ts">
  import { Dot, Bookmark } from "lucide-svelte";
  import { Button } from "$lib/components/ui/button";
  import { goto } from "$app/navigation";
  import type { Movie } from "tmdb-ts";

  let { movie }: { movie: Movie } = $props();
  let type = "Movie";
  let releaseYear = $derived(movie.release_date?.split("-")[0] || "N/A");
</script>

<div class="group relative shrink-0">
  <div
    class="pointer-events-none absolute top-1/2 left-1/2 z-40 h-full w-[250%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background opacity-0 blur-3xl transition-opacity delay-150 duration-300 group-hover:opacity-100"
  ></div>

  <button
    onclick={() => goto(`/movie/${movie.id}`)}
    class="pointer-events-none absolute top-1/2 left-1/2 z-50 flex h-96 w-80 -translate-x-1/2 -translate-y-1/2 scale-95 flex-col rounded-lg border border-[var(--border)] bg-background opacity-0 shadow-2xl transition-all delay-0 duration-300 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-hover:delay-150"
  >
    <div class="relative">
      <img
        class="aspect-3/2 w-full object-cover rounded-t-lg"
        src="https://image.tmdb.org/t/p/w500{movie.backdrop_path}"
        alt={movie.title}
      />
      <p
        class="absolute right-0 bottom-0 left-0 z-10 line-clamp-2 px-4 pb-2 text-left text-xl font-bold text-white [text-shadow:_0_2px_4px_black]"
      >
        {movie.title}
      </p>
      <div
        class="absolute bottom-0 h-1/2 w-full bg-gradient-to-t from-[var(--background)] to-transparent"
      ></div>
    </div>

    <div class="px-4 py-2 text-left flex-1">
      <p class="line-clamp-4 text-sm text-[var(--muted-foreground)]">
        {movie.overview}
      </p>
    </div>

    <div class="flex gap-2 p-4 pt-3 items-center">
      <Button size="sm">Details</Button>
      <Button variant="outline" size="icon">
        <Bookmark class="h-4 w-4" />
      </Button>
      <div
        class="flex flex-col items-center justify-center text-xs text-[var(--muted-foreground)] ml-auto"
      >
        <div class="flex items-center">
          <span>{releaseYear}</span>
          <Dot class="h-4 w-4" />
          <span>{movie.vote_average.toFixed(1)}/10</span>
        </div>
      </div>
    </div>
  </button>

  <div class="relative w-48 shrink-0">
    <a href="/movie/{movie.id}">
      <img
        class="mt-2 aspect-2/3 w-full rounded-lg border border-[var(--border)] object-cover"
        src="https://image.tmdb.org/t/p/w500{movie.poster_path}"
        alt={movie.title}
      />
      <p class="truncate pt-2 text-start font-bold">{movie.title}</p>
      <div class="flex justify-between text-sm text-[var(--muted-foreground)]">
        <div class="flex items-center text-xs">
          <span>{type}</span>
          <Dot class="h-4 w-4" />
          <span>{releaseYear}</span>
        </div>
      </div>
    </a>
  </div>
</div>
