<script lang="ts">
	import Image from '$lib/components/image.svelte';
	import { Button } from '$lib/components/ui/button';
	import { addon } from '$lib/stremio/store/addon';
	import { Settings, Trash } from 'lucide-svelte';
	let addonValue = $state({ manifest: '' });

	addon.subscribe((value) => {
		console.log('Addon Store Updated:', value);
	});
</script>

<div class="flex flex-col items-center justify-center gap-4 px-20 py-26">
	<div class="pointer-events-none fixed inset-x-0 bottom-4 z-1000 flex w-full justify-center">
		<div
			class="pointer-events-auto flex w-full max-w-2xl items-center justify-center gap-4 rounded-xl border border-border p-2 backdrop-blur-xl"
		>
			<input
				class="w-full rounded-md border bg-transparent p-2 text-white"
				type="text"
				placeholder="Manifest Url"
				bind:value={addonValue.manifest}
			/>
			<Button
				class="p-3"
				onclick={() => {
					(addon.install(addonValue.manifest), (addonValue.manifest = ''));
				}}>Install Addon</Button
			>
		</div>
	</div>
	{#each $addon.addons as addonItem}
		<div
			class="flex h-full w-full flex-col gap-4 rounded-md border p-4 sm:h-auto sm:flex-row sm:items-center sm:gap-6"
		>
			<Image
				src={addonItem.manifest.logo}
				alt={addonItem.manifest.name}
				class="aspect-square h-32 w-full rounded-md object-cover sm:h-24 sm:w-24"
			/>

			<div class="hidden flex-1 flex-col gap-1 sm:flex sm:min-w-0">
				<h2 class="truncate text-xl font-bold">{addonItem.manifest.name}</h2>
				<p class="line-clamp-2 text-sm text-gray-500">{addonItem.manifest.description}</p>
			</div>

			<div class="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-col">
				<Button
					variant="outline"
					onclick={() => addon.configure(addonItem)}
					disabled={addonItem.manifest.behaviorHints &&
						!addonItem.manifest.behaviorHints.configurable}
					class="whitespace-nowrap"><Settings class="mr-2 h-4 w-4" />Configure</Button
				>
				<Button
					variant="destructive"
					class="whitespace-nowrap"
					onclick={() => addon.uninstall(addonItem)}
				>
					<Trash class="mr-2 h-4 w-4" />Uninstall
				</Button>
			</div>
		</div>
	{/each}
</div>
