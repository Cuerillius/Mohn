<script lang="ts">
  import { ArrowRight } from "lucide-svelte";
  import { Badge } from "$lib/components/ui/badge";
  import ScrollArea from "./scrollArea.svelte";
  import Poster from "./Poster.svelte";
  import type { Movie } from "tmdb-ts";

  let {
    movies,
    name,
    icon: Icon,
    batchSize = 10,
    hasMore = false,
    onLoadMore,
  }: {
    movies: Movie[];
    icon?: any;
    name: string;
    batchSize?: number;
    hasMore?: boolean;
    onLoadMore?: () => void;
  } = $props();

  let visibleCount = $state(10);

  $effect(() => {
    visibleCount = Math.max(visibleCount, batchSize);
  });

  let visibleMovies = $derived(movies.slice(0, visibleCount));
  let canLoadMore = $derived(hasMore || visibleCount < movies.length);

  function handleLoadMore() {
    if (onLoadMore && canLoadMore) {
      onLoadMore();
      return;
    }

    if (canLoadMore) {
      visibleCount = Math.min(visibleCount + batchSize, movies.length);
    }
  }
</script>

<div>
  <div class="px-8 md:px-20 mb-4">
    <div class="flex items-center gap-4">
      <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        {#if Icon}<Icon size={24} />{/if}{name}
      </h2>
    </div>
    <a
      class="mt-1 flex w-fit items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
      href="/"
    >
      View more <ArrowRight class="h-4 w-4 ml-1" />
    </a>
  </div>

  <ScrollArea>
    {#each visibleMovies as movie}
      <Poster {movie} />
    {/each}

    <!-- "View More" end-of-list indicator -->
    <div class="relative w-48 shrink-0">
      <button
        type="button"
        class="block mt-2 w-full"
        onclick={handleLoadMore}
        disabled={!canLoadMore}
      >
        <div
          class={`flex aspect-2/3 w-full flex-col items-center justify-center rounded-lg border border-border transition-colors ${canLoadMore ? "hover:bg-[oklch(1_0_0/5%)]" : "opacity-50"}`}
        >
          <ArrowRight class="h-8 w-8 text-muted-foreground" />
          <p class="mt-2 font-medium text-muted-foreground">View more</p>
        </div>
      </button>
    </div>
  </ScrollArea>
</div>
