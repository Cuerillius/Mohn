<script lang="ts">
	import InitializationGuard from '$lib/stremio/InitializationGuard.svelte';
    import { auth } from '$lib/stremio/store/auth';
	import { addon } from '$lib/stremio/store/addon';
	import { discovery } from '$lib/stremio/store/discovery';
	let authValue = $state({email: '', password: ''});
	let addonValue = $state({manifest: ''});
	auth.subscribe(value => {
		console.log('Auth store updated:', value);
	});
	discovery.subscribe(value => {
		console.log('Discovery store updated:', value);
	});
</script>

<InitializationGuard>
	<div class="flex flex-col p-4 gap-4">
		<div class="flex flex-col border p-4 gap-4">
			<div class="flex flex-col border p-4">
				<p>IsLoggedIn: {$auth.isLoggedIn}</p>
				<p>User: {$auth.email}</p>
			</div>
			<div class="flex flex-col border p-4 gap-4">
				<input class="border px-1" type="text" placeholder="Email" bind:value={authValue.email} />
				<input class="border px-1"type="password" placeholder="Password" bind:value={authValue.password} />
			</div>
			<div class="flex gap-4 border p-4">
				<button class="border px-1" onclick={() => auth.login(authValue.email, authValue.password)}>Login</button>
				<button class="border px-1" onclick={() => auth.login("test", "test")}>Demo Login</button>
				<button class="border px-1" onclick={() => auth.login('test', 'wrong')}>Login Wrong</button>
				<button class="border px-1" onclick={() => auth.logout()}>Logout</button>
			</div>
		</div>

		<button class="border px-1" onclick={() => discovery.test()}>Test </button>
		
		<div class="flex flex-col border p-4 gap-4">
				<input class="border px-1 bg-gray-100" type="text" placeholder="Manifest" bind:value={addonValue.manifest} disabled />
				<button class="border px-1 bg-gray-100" onclick={() => addon.install(addonValue.manifest)} disabled>Install Addon</button>
				{#each $addon.addons as addonItem}
				<div class="border p-4">
					<p>{addonItem.manifest.name}</p>
					<p>{addonItem.manifest.id}</p>
					<button class="border px-1 bg-gray-100" onclick={()=> addon.uninstall(addonItem.manifest.id)} disabled>Uninstall Addon</button>
				</div>
				{/each}
			</div>

	</div>
</InitializationGuard>
