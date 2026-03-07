<script lang="ts">
	import { enhance } from '$app/forms';
	import AvatarMarble from '../../../components/AvatarMarble.svelte';

	let { data } = $props();
</script>

<div class="flex">
	<form method="post" action="?/deleteProfile" use:enhance>
		{#each data.userProfiles as profile (profile.id)}
			<div class="border p-4">
				<div>
					<AvatarMarble name={profile.name} size={200} square={true} />
				</div>
				<button type="submit" name="profileId" value={profile.id}>Delete</button>
				<span>{profile.name}</span>
				<p>{JSON.stringify(profile, null, 2)}</p>
			</div>
		{/each}
	</form>

	<form method="post" action="?/createProfile" use:enhance>
		<label
			>Name
			<input
				type="text"
				name="name"
				class="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
			/>
		</label>
		<button class="rounded-md bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
			>Create Profile</button
		>
	</form>

	<div>
		<h2 class="mb-4 text-2xl font-bold">Settings</h2>
		<form method="post" action="?/updateTorboxApiKey" use:enhance>
			<label
				>Torbox API Key
				<input
					type="text"
					name="torboxApiKey"
					value=""
					class="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>
			<button class="rounded-md bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
				>Update API Key</button
			>
		</form>
	</div>

	<div>
		<h2 class="mb-4 text-2xl font-bold">Addons</h2>
		<form method="post" action="?/addAddon" use:enhance>
			<label
				>Addon URL
				<input
					type="text"
					name="addonUrl"
					value=""
					class="mt-1 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
				/>
			</label>
			<button class="rounded-md bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
				>Add Addon</button
			>
		</form>
	</div>
</div>
