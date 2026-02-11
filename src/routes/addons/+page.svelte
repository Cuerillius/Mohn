<script lang="ts">
	import { addon } from '$lib/stremio/store/addon';
	let addonValue = $state({ manifest: '' });
</script>

<div class="flex flex-col gap-4 border p-4">
	<input class="border px-1" type="text" placeholder="Manifest" bind:value={addonValue.manifest} />
	<button class="border px-1" onclick={() => addon.install(addonValue.manifest)}
		>Install Addon</button
	>
	{#each $addon.addons as addonItem}
		<div class="border p-4">
			<p>{addonItem.manifest.name}</p>
			<p>{addonItem.manifest.id}</p>
			<button class="border px-1" onclick={() => addon.uninstall(addonItem)}>Uninstall Addon</button
			>
		</div>
	{/each}
</div>
