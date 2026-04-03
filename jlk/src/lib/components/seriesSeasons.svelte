<script lang="ts">
	import { BadgeCheck, Play } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import Image from './image.svelte';
	import ScrollArea from './scrollArea.svelte';

	let {
		episodes,
		selectedEpisode = $bindable()
	}: { episodes: Episode[]; selectedEpisode?: string | null } = $props();

	let sortedSeasons = $derived.by(() => {
		if (!episodes) return [];

		const groups = episodes.reduce(
			(acc, episode) => {
				const s = episode.season;
				if (!acc[s]) acc[s] = [];
				acc[s].push(episode);
				return acc;
			},
			{} as Record<number, Episode[]>
		);

		return Object.entries(groups)
			.map(([number, eps]) => ({
				number: parseInt(number),
				episodes: eps
			}))
			.sort((a, b) => {
				if (a.number === 0) return 1;
				if (b.number === 0) return -1;
				return a.number - b.number;
			});
	});

	function toggleSelect(id: string) {
		selectedEpisode = selectedEpisode === id ? null : id;
	}
</script>

{#if episodes}
	{#if episodes.length === 0}
		<div class="px-20 py-32">
			<h2 class="text-2xl font-bold">No episodes available</h2>
		</div>
	{:else}
		{#each sortedSeasons as season}
			<div class="mb-8">
				<div class="mb-4 px-20">
					<div class="flex gap-4">
						<h2 class="text-2xl font-bold">
							{season.number === 0 ? 'Specials' : `Season ${season.number}`}
						</h2>
					</div>
					<p class="flex w-fit items-center text-sm text-gray-500">
						{season.episodes.length}
						{season.episodes.length === 1 ? 'episode' : 'episodes'}
					</p>
				</div>

				<ScrollArea>
					{#each season.episodes as episode}
						{@const isSelected = selectedEpisode === episode.id}
						<button
							class="group relative flex w-80 shrink-0 flex-col rounded-xl p-3 text-left"
							onclick={() => toggleSelect(episode.id)}
						>
							<div class="relative aspect-video w-full overflow-hidden">
								{#if episode.watched}
									<Badge
										variant="secondary"
										class="absolute top-2 right-2 z-10 border-white/20 bg-black/60 text-white backdrop-blur-md"
									>
										<BadgeCheck class="mr-1 h-3 w-3" />Watched
									</Badge>
								{/if}
								<Image
									class="h-full w-full rounded-lg border object-cover {isSelected
										? 'border-primary/50'
										: 'border-border'}"
									src={episode.thumbnail}
									alt={episode.title}
								/>
								<div
									class="absolute inset-0 flex items-center justify-center transition-all duration-300
									{isSelected ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}"
								>
									<div class="rounded-full border bg-primary p-2 text-primary-foreground shadow-lg">
										<Play class="h-8 w-8" />
									</div>
								</div>
							</div>
							<div class="mt-3 flex flex-col gap-1 px-1">
								<div class="flex items-start justify-between">
									<span class="line-clamp-1 font-bold">
										{episode.episode}. {episode.title}
									</span>
								</div>

								<p class="line-clamp-2 text-xs text-muted-foreground">
									{episode.overview}
								</p>
							</div>
						</button>
					{/each}
				</ScrollArea>
			</div>
		{/each}
	{/if}
{/if}
