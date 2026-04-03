<script lang="ts">
	import { auth } from '$lib/stremio/store/auth';
	import { streamingServer } from '$lib/stremio/store/streamingServer';
	import { streamingServerUrls } from '$lib/stremio/store/streamingServerUrls';

	let authValue = $state({ email: '', password: '' });
	let streamingServerUrlsValue = $state({ newServerUrl: '' });
</script>

<div class="flex flex-col gap-4 border px-20 py-32">
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
		<button class="border px-1" onclick={() => auth.login(authValue.email, authValue.password)}
			>Login</button
		>
		<button class="border px-1" onclick={() => auth.login('test', 'test')}>Demo Login</button>
		<button class="border px-1" onclick={() => auth.login('test', 'wrong')}>Login Wrong</button>
		<button class="border px-1" onclick={() => auth.logout()}>Logout</button>
	</div>
	<div class="flex gap-4 border p-4">
		<p>Selected {$streamingServer.url}</p>
		{#each $streamingServerUrls.streamingServerUrls as url}
			<div class="flex gap-4 border p-4">
				<button
					class="border px-1"
					onclick={() => streamingServerUrls.selectServerUrl(url.url)}
					disabled={$streamingServer.url === url.url}
				>
					Select {url.url}
				</button>
				<button class="border px-1" onclick={() => streamingServerUrls.deleteServerUrl(url.url)}>
					Remove
				</button>
			</div>
		{/each}
		<input
			class="border px-1"
			type="text"
			placeholder="New Server URL"
			bind:value={streamingServerUrlsValue.newServerUrl}
		/>
		<button onclick={() => streamingServerUrls.addServerUrl(streamingServerUrlsValue.newServerUrl)}
			>Add</button
		>
	</div>
</div>
