<script lang="ts">
	import { board } from '$lib/stremio/store/board';
	import Autoplay from 'embla-carousel-autoplay';

	import * as Carousel from '$lib/components/ui/carousel/index.js';
	import Image from '$lib/components/image.svelte';
	import type { CarouselAPI } from '$lib/components/ui/carousel/context';
	import Button from '$lib/components/ui/button/button.svelte';
	import { ArrowLeft, ArrowRight, Info, Play, Star } from 'lucide-svelte';
	import Badge from '$lib/components/ui/badge/badge.svelte';
	import { goto } from '$app/navigation';

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
						<div class="relative h-screen w-full overflow-hidden">
							<Image src={item.background} alt={item.name} class="h-full w-full object-cover" />

							<div
								class="absolute inset-x-0 top-0 z-10 h-60 bg-linear-to-b from-background via-background/30 to-transparent"
							></div>
							<div
								class="absolute inset-y-0 left-0 z-10 w-48 bg-linear-to-r from-background to-transparent opacity-80"
							></div>
							<div
								class="absolute inset-y-0 right-0 z-10 w-48 bg-linear-to-l from-background to-transparent opacity-80"
							></div>

							<div
								class="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_bottom,_transparent_20%,_hsl(var(--background))_100%)] opacity-90"
							></div>

							<div
								class="absolute inset-x-0 bottom-0 z-30 h-1/2 bg-linear-to-t from-background via-background/40 to-transparent"
							></div>
							<div
								class="absolute right-0 bottom-0 left-0 h-2/4 bg-linear-to-t from-background to-transparent"
							></div>
							<div class="absolute bottom-1/6 left-20 z-40 max-w-2xl">
								<div class="flex gap-4">
									<Badge variant="default" class="mb-2 text-sm font-medium">
										{catalog.addon.manifest.name}
									</Badge>
									<Badge variant="outline" class="mb-2 text-sm font-medium">
										{catalog.name}
									</Badge>
								</div>
								<Image src={item.logo} alt={item.name} class=" w-min-20 h-48 rounded-xl" />
								<div class="mt-1 flex gap-2">
									{#each item.links as link}
										{#if link.category === 'Genres'}
											<Badge variant="outline" class="px-3 py-2">{link.name}</Badge>
										{:else if link.category === 'imdb'}
											<Badge variant="outline" class="px-3 py-2"
												><Star color="yellow" fill="currentColor" />{link.name}</Badge
											>
										{/if}
									{/each}
								</div>
								<p class="my-6 w-120 text-gray-300">{item.description}</p>
								<div class="flex gap-6">
									<Button class="p-6" onclick={() => goto(`/meta/${item.type}/${item.id}`)}
										><Play />Watch Now</Button
									>
									<Button
										variant="outline"
										class="p-6"
										onclick={() => goto(`/meta/${item.type}/${item.id}`)}><Info />More Info</Button
									>
								</div>
							</div>
						</div></Carousel.Item
					>
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
