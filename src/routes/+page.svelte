<script lang="ts">
	import InitializationGuard from '$lib/stremio/InitializationGuard.svelte';
	import { auth } from '$lib/stremio/store/auth';
	import { addon } from '$lib/stremio/store/addon';
	import { discover } from '$lib/stremio/store/discover';
	import { meta } from '$lib/stremio/store/meta';

	let authValue = $state({ email: '', password: '' });
	let addonValue = $state({ manifest: '' });
	let metaId = $state('');

	let visibility = $state(1);
	auth.subscribe((value) => {
		console.log('Auth store updated:', value);
	});
	discover.subscribe((value) => {
		console.log('Discover store updated:', value);
	});
	meta.subscribe((value) => {
		console.log('Meta store updated:', value);
	});
</script>

<InitializationGuard>
	<div class="flex gap-4 p-4">
		<h1 class="text-2xl font-bold">JLK</h1>
		<button class="border px-1" onclick={() => (visibility = 1)}>Auth</button>
		<button class="border px-1" onclick={() => (visibility = 2)}>Addons</button>
		<button class="border px-1" onclick={() => (visibility = 3)}>Discovery</button>
		<button class="border px-1" onclick={() => (visibility = 4)}>Meta</button>
	</div>
	<div class="flex flex-col gap-4 p-4">
		{#if visibility === 1}
			<div class="flex flex-col gap-4 border p-4">
				<div class="flex flex-col border p-4">
					<p>IsLoggedIn: {$auth.isLoggedIn}</p>
					<p>User: {$auth.email}</p>
				</div>
				<div class="flex flex-col gap-4 border p-4">
					<input class="border px-1" type="text" placeholder="Email" bind:value={authValue.email} />
					<input
						class="border px-1"
						type="password"
						placeholder="Password"
						bind:value={authValue.password}
					/>
				</div>
				<div class="flex gap-4 border p-4">
					<button
						class="border px-1"
						onclick={() => auth.login(authValue.email, authValue.password)}>Login</button
					>
					<button class="border px-1" onclick={() => auth.login('test', 'test')}>Demo Login</button>
					<button class="border px-1" onclick={() => auth.login('test', 'wrong')}
						>Login Wrong</button
					>
					<button class="border px-1" onclick={() => auth.logout()}>Logout</button>
				</div>
			</div>
		{/if}
		{#if visibility === 2}
			<div class="flex flex-col gap-4 border p-4">
				<input
					class="border px-1"
					type="text"
					placeholder="Manifest"
					bind:value={addonValue.manifest}
				/>
				<button class="border px-1" onclick={() => addon.install(addonValue.manifest)}
					>Install Addon</button
				>
				{#each $addon.addons as addonItem}
					<div class="border p-4">
						<p>{addonItem.manifest.name}</p>
						<p>{addonItem.manifest.id}</p>
						<button class="border px-1" onclick={() => addon.uninstall(addonItem)}
							>Uninstall Addon</button
						>
					</div>
				{/each}
			</div>
		{/if}
		{#if visibility === 3}
			<div class="flex flex-col gap-4 border p-4">
				<p>Discovery Data:</p>
				{#each $discover?.catalogs?.selectable?.catalogs as catalog}
					<div class="border p-4">
						<p>{catalog.name}</p>
						<p>{catalog.addon.manifest.name}</p>
						<button class="border px-1" onclick={() => discover.test(catalog)}>Test Discover</button
						>
					</div>
				{/each}
			</div>
		{/if}
		{#if visibility === 4}
			<div class="flex flex-col gap-4 border p-4">
				<input class="border px-1" type="text" placeholder="ID" bind:value={metaId} />
				<button class="border px-1" onclick={() => meta.loadMeta(metaId)}>Fetch Meta</button>
				<button class="border px-1" onclick={() => meta.loadMeta('tt0133093')}
					>Demo Fetch Meta</button
				>
				<div class="flex flex-col gap-4 border p-4">
					<p>Meta Data:</p>
					{#each $meta?.meta?.streams as metaItem}
						<p>{metaItem.addon.manifest.name}</p>
						{#each metaItem.content.content as metaItemItem}
							<div class="border p-4">
								<p>{metaItemItem.name}</p>
								<p>{metaItemItem.description}</p>
							</div>
						{/each}
					{/each}
				</div>
			</div>
		{/if}
	</div>
</InitializationGuard>
