<script lang="ts">
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';

	import { Button } from '$lib/components/ui/button';

	let { children } = $props();

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
		{@render children()}
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

<style>
	.scrollbar-hide {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}
	.scrollbar-hide::-webkit-scrollbar {
		display: none;
	}
</style>
