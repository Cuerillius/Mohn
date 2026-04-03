<script lang="ts">
  import Autoplay from "embla-carousel-autoplay";
  import * as Carousel from "$lib/components/ui/carousel/index.js";
  import type { CarouselAPI } from "$lib/components/ui/carousel/context";
  import Button from "$lib/components/ui/button/button.svelte";
  import { ArrowLeft, ArrowRight } from "lucide-svelte";
  import HeroDetail from "./heroDetail.svelte";
  import type { Movie } from "tmdb-ts";
  import Hero from "./Hero.svelte";

  let { movies }: { movies: Movie[] } = $props();

  let api = $state<CarouselAPI>();
  let current = $state(0);
  let count = $state(0);

  const plugin = Autoplay({ delay: 5000 });

  $effect(() => {
    if (!api) return;
    count = api.scrollSnapList().length;
    current = api.selectedScrollSnap() + 1;

    const onSelect = () => {
      current = api!.selectedScrollSnap() + 1;
    };

    api.on("select", onSelect);
    return () => api?.off("select", onSelect);
  });
</script>

<div class="group relative">
  <Carousel.Root
    setApi={(emblaApi) => (api = emblaApi)}
    plugins={[plugin]}
    opts={{ loop: true }}
    class="w-full"
  >
    <Carousel.Content>
      {#each movies as movie}
        <Carousel.Item>
          <!-- Assuming HeroDetail expects a 'movie' prop instead of 'item' -->
          <Hero {movie} />
        </Carousel.Item>
      {/each}
    </Carousel.Content>

    <!-- Navigation Buttons -->
    <div
      class="absolute inset-y-0 left-0 z-20 flex items-center justify-center w-20 pointer-events-none"
    >
      <Button
        variant="secondary"
        size="icon"
        class="rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
        onclick={() => api?.scrollPrev()}
      >
        <ArrowLeft class="h-6 w-6" />
      </Button>
    </div>

    <div
      class="absolute inset-y-0 right-0 z-20 flex items-center justify-center w-20 pointer-events-none"
    >
      <Button
        variant="secondary"
        size="icon"
        class="rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
        onclick={() => api?.scrollNext()}
      >
        <ArrowRight class="h-6 w-6" />
      </Button>
    </div>
  </Carousel.Root>

  <!-- Dots Indicator -->
  {#if count > 1}
    <div
      class="absolute right-0 bottom-8 left-0 z-10 flex justify-center gap-2"
    >
      {#each Array.from({ length: count }) as _, i}
        <button
          class="h-2 w-2 rounded-full transition-all duration-300 {current ===
          i + 1
            ? 'w-6 bg-white'
            : 'bg-white/50 hover:bg-white/80'}"
          onclick={() => api?.scrollTo(i)}
          aria-label="Go to slide {i + 1}"
        ></button>
      {/each}
    </div>
  {/if}
</div>
