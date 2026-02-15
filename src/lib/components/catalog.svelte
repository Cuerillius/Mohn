<script lang="ts">
	import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import CatalogSkeleton from '$lib/components/skeletons/catalog.svelte';
	import CatalogItem from '$lib/components/catalogItem.svelte';

	let { catalog }: { catalog: Catalog } = $props();

	function scrollCarousel(e: MouseEvent, direction: 'left' | 'right') {
		const button = e.currentTarget as HTMLButtonElement;
		const container = button.parentElement?.querySelector('.carousel-container');

		if (container) {
			const scrollAmount = container.clientWidth * 0.75;
			container.scrollBy({
				left: direction === 'left' ? -scrollAmount : scrollAmount,
				behavior: 'smooth'
			});
		}
	}
</script>

{#if catalog?.content}
	{#if catalog.content.type === 'Loading'}
		<CatalogSkeleton />
	{:else if catalog.content.type === 'Ready'}
		<div>
			<div class="px-20">
				<div class="flex gap-4">
					<h2 class="text-2xl font-bold">{catalog.name}</h2>
					<div class="flex items-baseline-last gap-2">
						<Badge variant="outline"
							>{catalog.type.charAt(0).toLocaleUpperCase() + catalog.type.slice(1)}</Badge
						>
						<Badge variant="outline">{catalog.addon.manifest.name}</Badge>
					</div>
				</div>
				<a class="flex w-fit items-center text-sm text-gray-500" href="/"
					>View more <ArrowRight class="h-4 w-4" /></a
				>
			</div>

			<div class="group/carousel relative">
				<button
					onclick={(e) => scrollCarousel(e, 'left')}
					class=" absolute top-1/2 left-0 z-60 h-3/4 w-20 -translate-y-1/2 bg-linear-to-r from-background via-background to-transparent"
				>
					<Button
						variant="secondary"
						size="icon"
						class=" z-40 rounded-full opacity-0 shadow-xl transition-all duration-300 group-hover/carousel:opacity-100 disabled:opacity-0"
						onclick={(e) => scrollCarousel(e, 'left')}
					>
						<ChevronLeft class="h-6 w-6" />
					</Button>
				</button>

				<div
					class="carousel-container scrollbar-hide -my-32 flex w-full gap-8 overflow-x-auto scroll-smooth px-20 py-32"
				>
					{#each catalog.content.content as entry}
						<CatalogItem {entry} />
					{/each}
					{#if catalog.content.content.length === 10}
						<div class="relative w-48 shrink-0">
							<a href="/">
								<div
									class="mt-2 flex aspect-2/3 w-full flex-col items-center justify-center rounded-lg border border-muted"
								>
									<ArrowRight class="h-8 w-8 text-gray-500" />
									<p class="text-gray-500">View more</p>
								</div>
							</a>
						</div>
					{/if}
				</div>

				<button
					onclick={(e) => scrollCarousel(e, 'right')}
					class=" absolute top-1/2 right-0 z-60 h-3/4 w-20 -translate-y-1/2 bg-linear-to-l from-background via-background to-transparent"
				>
					<Button
						variant="secondary"
						size="icon"
						class="rounded-full opacity-0 shadow-xl transition-all duration-300 group-hover/carousel:opacity-100"
						onclick={(e) => scrollCarousel(e, 'right')}
					>
						<ChevronRight class="h-6 w-6" />
					</Button>
				</button>
			</div>
		</div>
	{/if}
{/if}

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
