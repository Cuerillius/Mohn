<script lang="ts">
	import { auth } from '$lib/stremio/store/auth';

	let authValue = $state({ email: '', password: '' });

	auth.subscribe((value) => {
		console.log('Auth store updated:', value);
	});
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
</div>
