<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import CatalogSkeleton from '$lib/components/skeletons/catalog.svelte';
	import CatalogItem from '$lib/components/catalogItem.svelte';
	import ScrollArea from './scrollArea.svelte';

	let { catalog }: { catalog: Catalog } = $props();
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

			<ScrollArea>
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
			</ScrollArea>
		</div>
	{/if}
{/if}
