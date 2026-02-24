<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import CatalogItem from '$lib/components/catalogItem.svelte';
	import ScrollArea from './scrollArea.svelte';

	let {
		catalog,
		name,
		icon: Icon,
		type,
		addon
	}: {
		catalog: DiscoverItem[];
		icon?: any;
		name: string;
		type: string | null;
		addon?: {
			manifest: {
				id: string;
				name: string;
			};
		};
	} = $props();
</script>

<div>
	<div class="px-20">
		<div class="flex gap-4">
			<h2 class="flex items-center gap-2 text-2xl font-bold">
				{#if Icon}<Icon fill="currentColor" />{/if}{name}
			</h2>
			<div class="flex items-baseline-last gap-2">
				<Badge variant="outline"
					>{type ? type.charAt(0).toLocaleUpperCase() + type.slice(1) : 'All'}</Badge
				>
				{#if addon?.manifest.name}<Badge variant="outline">{addon?.manifest.name}</Badge>{/if}
			</div>
		</div>
		<a class="flex w-fit items-center text-sm text-gray-500" href="/"
			>View more <ArrowRight class="h-4 w-4" /></a
		>
	</div>

	<ScrollArea>
		{#each catalog as entry}
			<CatalogItem {entry} />
		{/each}
		{#if catalog.length === 10}
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
	</ScrollArea>
</div>
