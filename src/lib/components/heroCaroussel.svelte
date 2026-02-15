<script lang="ts">
	import Autoplay from 'embla-carousel-autoplay';
	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ArrowLeft, ArrowRight, BadgeCheck, Dot, Info, Play, Star } from 'lucide-svelte';
	import HeroDetail from './heroDetail.svelte';

	let { catalog }: { catalog: Catalog } = $props();

	let api = $state<CarouselAPI>();
	let current = $state(0);
	let count = $state(0);

	const plugin = Autoplay({
		delay: 5000
	});

	$effect(() => {
		if (!api) return;

		count = api.scrollSnapList().length;
		current = api.selectedScrollSnap() + 1;

		api.on('select', () => {
			current = api!.selectedScrollSnap() + 1;
		});
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
			{#if catalog.content?.type === 'Ready'}
				{#each catalog.content.content as item}
					<Carousel.Item>
						<HeroDetail {item} {catalog} />
					</Carousel.Item>
				{/each}
			{/if}
		</Carousel.Content>

		<button
			class=" absolute top-1/2 left-0 z-60 h-full w-20 -translate-y-1/2"
			onclick={() => api?.scrollPrev()}
		>
			<Button
				variant="secondary"
				size="icon"
				class=" z-40 rounded-full shadow-xl transition-all duration-300 "
			>
				<ArrowLeft class="h-6 w-6" />
			</Button>
		</button>
		<button
			class=" absolute top-1/2 right-0 z-60 h-full w-20 -translate-y-1/2"
			onclick={() => api?.scrollNext()}
		>
			<Button
				variant="secondary"
				size="icon"
				class=" z-40 rounded-full shadow-xl transition-all duration-300 "
			>
				<ArrowRight class="h-6 w-6" />
			</Button>
		</button>
	</Carousel.Root>

	{#if count > 1}
		<div class="absolute right-0 bottom-8 left-0 z-10 flex justify-center gap-2">
			{#each Array.from({ length: count }) as _, i}
				<button
					class="h-2 w-2 rounded-full transition-all duration-300 {current === i + 1
						? 'w-6 bg-white'
						: 'bg-white/50 hover:bg-white/80'}"
					onclick={() => api?.scrollTo(i)}
					aria-label="Go to slide {i + 1}"
				></button>
			{/each}
		</div>
	{/if}
</div>
