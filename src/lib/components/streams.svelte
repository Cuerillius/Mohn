<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/button/button.svelte';
	import { meta } from '$lib/stremio/store/meta';
	import { stream } from '$lib/stremio/store/player';
	import { HardDrive, Info, Layers, OctagonAlert, Play } from 'lucide-svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';

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

	meta.subscribe((value) => {
		console.log('Meta store updated:', value);
	});
	function selectStream(selectedStream: Stream) {
		stream.set(selectedStream);
		goto('/player');
	}

	const triggerContent = $derived(
		streams.find((f) => f.addon.manifest.id === value)?.addon.manifest.name ?? 'All Addons'
	);

	function formatSize(desc: string) {
		const match = desc.match(/(\d+(\.\d+)?\s*(TB|GB|MB|KB))/i);
		return match ? match[0] : null;
	}
</script>

<div
	class="absolute top-26 right-12 bottom-4 z-50 flex w-105 flex-col rounded-xl border bg-background/40 shadow-2xl backdrop-blur-xl"
>
	<div class="flex items-center justify-between border-b p-5">
		<div>
			<h3 class="text-lg font-bold text-white">Available Streams</h3>
			<p class="text-xs">Select a source to start playing</p>
		</div>

		<Select.Root type="single" name="Addon" bind:value>
			<Select.Trigger class="w-40  bg-white/5 hover:bg-white/10">
				<Layers class="mr-2 h-3.5 w-3.5 opacity-50" />
				<span class="truncate">{triggerContent}</span>
			</Select.Trigger>
			<Select.Content class=" bg-neutral-900 text-white">
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
		<div class="flex flex-col items-center justify-center gap-2 p-8 text-center text-sm">
			<div class="rounded-lg border p-3">
				<OctagonAlert class="h-8 w-8" />
			</div>
			<p class="text-lg font-bold">No available streams</p>
			<p class="w-60">Go and install some addons that provide streams for this content</p>
			<Button variant="outline" onclick={() => goto('/addons')}>Addons</Button>
		</div>
	{:else}
		<div class="custom-scrollbar flex-1 overflow-y-auto p-4">
			<div class="flex flex-col gap-3">
				{#each filteredStreams as metaItem}
					{#if metaItem.content?.type === 'Ready'}
						{#each metaItem.content.content as stream}
							<button
								class="group relative flex flex-col rounded-xl border bg-white/5 p-4 text-left transition-all hover:border-primary/50 hover:bg-white/10"
								onclick={() => selectStream(stream)}
							>
								<div class="flex items-start justify-between">
									<div class="flex flex-col">
										<span class="line-clamp-1 text-sm font-bold text-white">{stream.name}</span>
									</div>
									<div
										class="rounded-full bg-primary/20 p-2 text-primary opacity-0 transition-opacity group-hover:opacity-100"
									>
										<Play fill="currentColor" class="h-4 w-4" />
									</div>
								</div>

								<p class="line-clamp-3 text-sm leading-relaxed">
									{stream.description}
								</p>

								<div class="mt-2 flex items-center gap-3 border-t pt-2 text-xs">
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
						{#each Array(5) as _}
							<Skeleton class="h-40 w-full rounded-lg" />
						{/each}
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>
