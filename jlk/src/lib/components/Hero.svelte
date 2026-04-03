<script lang="ts">
  import { Play, Info } from "lucide-svelte";
  import { goto } from "$app/navigation";

  // Assuming you still have these components in your library
  import Image from "$lib/components/image.svelte";
  import ImageVignete from "./imageVignete.svelte";
  import DetailBlock from "./detailBlock.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import type { Movie } from "tmdb-ts";
  import Metadata from "./Metadata.svelte";

  let { movie }: { movie: Movie } = $props();
</script>

<div class="relative h-[80vh] w-full overflow-hidden">
  <!-- TMDB Background -->
  <img
    src="https://image.tmdb.org/t/p/original{movie.backdrop_path}"
    alt={movie.title}
    class="h-full w-full object-cover"
  />

  <ImageVignete />

  <div class="absolute bottom-20 left-8 md:left-20 z-40 max-w-2xl">
    <!-- 
            Note: You may need to adapt DetailBlock to accept a 'movie' 
            instead of an 'item'. 
        -->
    <Metadata {movie} />

    <div class="flex gap-4 mt-6">
      <Button
        variant="default"
        class="px-8 py-6 text-lg"
        onclick={() => goto(`/movie/${movie.id}`)}
      >
        <Play class="mr-2" />Watch Now
      </Button>
      <Button
        variant="secondary"
        class="px-8 py-6 text-lg bg-white/20 hover:bg-white/30 text-white border-0"
        onclick={() => goto(`/movie/${movie.id}`)}
      >
        <Info class="mr-2" />More Info
      </Button>
    </div>
  </div>
</div>
