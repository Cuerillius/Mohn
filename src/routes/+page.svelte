<script lang="ts">
	import { goto } from '$app/navigation';
	import { board } from '$lib/stremio/store/board';
	import { onMount } from 'svelte';
	import { ArrowRight, BadgeCheck, Dot, Bookmark, Star, ImageOff } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import Image from '$lib/components/image.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';

	board.subscribe((value) => {
		console.log('Board store updated:', value);
	});

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

	onMount(() => {
		board.initialLoad();
		board.loadRange(0, 100);
	});
</script>

<div class="flex flex-col gap-8">
	{#each $board.catalogs as catalog}
		{#if catalog?.content}
			{#if catalog.content.type === 'Loading'}
				<div class="flex flex-col">
					<div class="flex items-center gap-4">
						<Skeleton class="h-8 w-48" />
						<div class="flex gap-2">
							<Skeleton class="h-6 w-16 rounded-full" />
							<Skeleton class="h-6 w-24 rounded-full" />
						</div>
					</div>
					<Skeleton class="mt-2 h-4 w-20" />

					<div class="flex w-full gap-4 overflow-hidden pt-6">
						{#each { length: 10 } as _}
							<div class="flex w-48 shrink-0 flex-col gap-2">
								<Skeleton class="aspect-2/3 w-full rounded-lg" />

								<Skeleton class="h-4 w-3/4" />
								<div class="flex items-center gap-2">
									<Skeleton class="h-3 w-1/4" />
									<Skeleton class="h-3 w-1/3" />
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else if catalog.content.type === 'Ready'}
				<div>
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
					<div class="flex w-full gap-4 pt-6">
						{#each catalog.content.content as entry}
							<div class="group relative">
								<div
									class="pointer-events-none absolute top-1/2 left-1/2 z-40 h-full w-[250%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background opacity-0 blur-3xl transition-opacity delay-150 duration-300 group-hover:opacity-100"
								></div>
								<a
									href="/meta/{entry.type}/{entry.id}"
									class="pointer-events-none absolute top-1/2 left-1/2 z-50 flex h-96 w-84 -translate-x-1/2 -translate-y-1/2 scale-95 flex-col rounded-lg border border-accent bg-background opacity-0 shadow-2xl transition-all delay-0 duration-300 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-hover:delay-150"
								>
									<div class="relative">
										{#if entry.watched}
											<Badge variant="outline" class="absolute top-2 right-2 backdrop-blur-lg"
												><BadgeCheck class="h-4" />Watched</Badge
											>
										{/if}
										<Image
											class="aspect-3/2 rounded-t-lg"
											src={entry.background}
											alt={entry.name}
										/>
										<p
											class="warp-break-words absolute right-0 bottom-0 left-0 z-10 line-clamp-3 px-4 pb-2 text-xl font-bold"
										>
											{entry.name}
										</p>
										<div
											class="absolute bottom-0 h-3/4 w-full bg-linear-to-t from-background to-transparent"
										></div>
									</div>
									<div class="flex gap-2 pl-4">
										{#each entry.links as link}
											{#if link.category === 'Genres'}
												<Badge variant="outline">{link.name}</Badge>
											{:else if link.category === 'imdb'}
												<Badge variant="outline"><Star />{link.name}</Badge>
											{/if}
										{/each}
									</div>
									<p class=" wrap-break-words line-clamp-5 px-4 pt-2 text-sm text-gray-500">
										{entry.description}
									</p>
									<div class="flex-1"></div>
									<div class="flex gap-2 p-4">
										<Button>Details</Button>
										<Button variant="outline" size="icon"><Bookmark /></Button>
									</div>
								</a>
								<div class="relative w-48 shrink-0">
									<a href="/meta/{entry.type}/{entry.id}">
										{#if entry.watched}
											<Badge variant="outline" class="absolute top-2 right-2 backdrop-blur-lg"
												><BadgeCheck class="h-4" />Watched</Badge
											>
										{/if}
										<Image
											class="mt-2 aspect-2/3 h-full rounded-lg border border-muted"
											src={entry.poster}
											alt={entry.name}
										/>

										<p class="truncate pt-2 text-start font-bold">{entry.name}</p>
										<div class="flex justify-between text-sm text-gray-500">
											<div class="flex">
												<p>{catalog.type.charAt(0).toLocaleUpperCase() + catalog.type.slice(1)}</p>
												{#if entry.releaseInfo}
													<Dot class="h-6 w-6" />
												{/if}
												<p>
													{entry.releaseInfo
														?.replace(/([-–—])\s*(\d*)/g, (match, dash, nextDigits) => {
															return nextDigits ? ` - ${nextDigits}` : ' - Today';
														})
														.trim()}
												</p>
											</div>
										</div>
									</a>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	{/each}
</div>
