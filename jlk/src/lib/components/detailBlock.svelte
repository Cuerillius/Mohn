<script lang="ts">
	import { BadgeCheck, Dot, Star } from 'lucide-svelte';
	import Image from './image.svelte';
	import Badge from './ui/badge/badge.svelte';

	let { catalog, item }: { catalog?: Catalog; item: DiscoverItem } = $props();
</script>

<div>
	<div class="mb-2 flex gap-4">
		{#if catalog}
			<Badge variant="default" class="text-sm font-medium">
				{catalog.addon.manifest.name}
			</Badge>
			<Badge variant="outline" class=" text-sm font-medium backdrop-blur-lg">
				{catalog.name}
			</Badge>
		{/if}
		{#if item.watched}
			<Badge variant="outline" class=" backdrop-blur-lg"><BadgeCheck class="h-4" />Watched</Badge>
		{/if}
	</div>
	<Image src={item.logo} alt={item.name} class=" w-min-20 h-48" />
	<div class="mt-1 flex gap-2">
		{#each item.links as link}
			{#if link.category === 'Genres'}
				<Badge variant="outline" class="px-4 py-2 backdrop-blur-lg">{link.name}</Badge>
			{:else if link.category === 'imdb'}
				<Badge variant="outline" class="px-4 py-2  backdrop-blur-lg"
					><Star color="yellow" fill="currentColor" />{link.name}</Badge
				>
			{/if}
		{/each}
	</div>
	<div class="my-4 flex w-full flex-col text-gray-300">
		<div class="flex">
			<p>
				{item.runtime}
			</p>
			{#if item.releaseInfo}
				<Dot class="h-6 w-6" />
			{/if}
			<p>
				{item.releaseInfo
					?.replace(/([-–—])\s*(\d*)/g, (match, dash, nextDigits) => {
						return nextDigits ? ` - ${nextDigits}` : ' - Today';
					})
					.trim()}
			</p>
		</div>
	</div>
	<p class="mb-6 w-120 text-gray-300">{item.description}</p>
</div>
