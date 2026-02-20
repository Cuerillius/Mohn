<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { encodeStream } from '$lib/streamCoder';
	import { Dot, HardDrive, Info, Layers, OctagonAlert, Play } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
	import EmptyState from './emptyState.svelte';

	let {
		streams
	}: {
		streams: {
			content: Loadable<Array<Stream>>;
			addon: Addon;
		}[];
	} = $props();

	let value = $state('all');

	let filteredStreams = $derived(
		value === 'all' ? streams : streams.filter((s) => s.addon.manifest.id === value)
	);

	function selectStream(selectedStream: Stream) {
		const encoded = encodeStream({ ...selectedStream, deepLinks: null });
		goto(`/player/${encoded}`);
	}

	const triggerContent = $derived(
		streams.find((f) => f.addon.manifest.id === value)?.addon.manifest.name ?? 'All Addons'
	);

	function formatSize(desc: string) {
		const match = desc.match(/(\d+(\.\d+)?\s*(TB|GB|MB|KB))/i);
		return match ? match[0] : null;
	}

	function formatSeriesInfo(desc: string) {
		const seasonMatch = desc.match(/[Ss](?:eason)?\s*(\d+)/i);
		const episodeMatch = desc.match(/[Ee](?:p(?:isode)?)?\s*(\d+)/i);

		return {
			season: seasonMatch ? parseInt(seasonMatch[1], 10) : null,
			episode: episodeMatch ? parseInt(episodeMatch[1], 10) : null
		};
	}
</script>

<div
	class=" absolute top-26 right-12 bottom-4 z-50 flex w-105 flex-col rounded-xl border bg-background/40 shadow-2xl backdrop-blur-xl"
>
	<div class="flex items-center justify-between border-b p-5">
		<div>
			<h3 class="text-lg font-bold text-white">Available Streams</h3>
			<p class="text-xs">Select a source to start playing</p>
		</div>

		<Select.Root type="single" name="Addon" bind:value>
			<Select.Trigger class="w-40 bg-white/5 hover:bg-white/10">
				<Layers class="mr-2 h-3.5 w-3.5 opacity-50" />
				<span class="truncate">{triggerContent}</span>
			</Select.Trigger>
			<Select.Content class="bg-neutral-900 text-white">
				<Select.Group>
					<Select.Item
						value={'all'}
						label={'All Addons'}
						class="focus:bg-primary focus:text-white"
					/>
					{#each streams as stream}
						<Select.Item
							value={stream.addon.manifest.id}
							label={stream.addon.manifest.name}
							disabled={stream.content.type === 'Err' || stream.content.type == 'Loading'}
						/>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
	</div>

	{#if filteredStreams.length === 0 || filteredStreams.every((s) => s.content?.type === 'Err')}
		<EmptyState
			icon={OctagonAlert}
			layout="container"
			title="No available streams"
			titleClass="text-lg font-bold"
			descriptionClass="text-white"
			description="Go and install some addons that provide streams for this content."
		>
			<Button variant="outline" onclick={() => goto('/addons')}>Addons</Button>
		</EmptyState>
	{:else}
		<div class="flex-1 overflow-y-auto p-4">
			<div class="flex flex-col gap-3">
				{#each filteredStreams as metaItem}
					{#if metaItem.content?.type === 'Ready'}
						{#each metaItem.content.content as stream}
							<button
								class="group relative flex flex-col rounded-xl border bg-white/5 p-4 text-left transition-all hover:border-primary/50 hover:bg-white/10"
								onclick={() => selectStream(stream)}
							>
								<div class="flex items-start justify-between">
									<div class="flex">
										<span class="line-clamp-1 text-sm font-bold text-white">{stream.name}</span>
									</div>
									<div
										class="rounded-full bg-primary/20 p-2 text-primary opacity-0 transition-opacity group-hover:opacity-100"
									>
										<Play fill="currentColor" class="h-4 w-4" />
									</div>
								</div>
								<div class="flex items-center gap-3 border-t pt-2 text-xs">
									<div>
										{#if formatSeriesInfo(stream.description)?.season && formatSeriesInfo(stream.description)?.episode}
											<div class="flex items-center">
												<p class="-mr-2">
													S{formatSeriesInfo(stream.description)?.season}
												</p>
												<Dot class="h-6 w-6"></Dot>
												<p class="-ml-2">
													E{formatSeriesInfo(stream.description)?.episode}
												</p>
											</div>
										{:else if formatSeriesInfo(stream.description)?.episode}
											<p>
												E{formatSeriesInfo(stream.description)?.episode}
											</p>
										{:else if formatSeriesInfo(stream.description)?.season}
											<p>
												S{formatSeriesInfo(stream.description)?.season}
											</p>
										{/if}
									</div>
									{#if formatSize(stream.description)}
										<div class="flex items-center gap-1">
											<HardDrive class="h-3 w-3" />
											{formatSize(stream.description)}
										</div>
									{/if}
									<div class="flex items-center gap-1">
										<Info class="h-3 w-3" />
										{metaItem.addon.manifest.name}
									</div>
								</div>
							</button>
						{/each}
					{:else if metaItem.content?.type === 'Loading'}
						{#each Array(10) as _}
							<Skeleton class="h-23 w-full rounded-lg" />
						{/each}
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
