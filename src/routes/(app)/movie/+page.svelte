<script lang="ts">
	import { goto } from '$app/navigation';

	let { data, form } = $props();
</script>

{#if !data.isAutheticated}
	<p>Please log in to see search results.</p>
{/if}

{#if form?.stream}
	<button
		onclick={() =>
			goto(`/player?type=${'torrent'}&presigned_token=${form?.stream?.data?.presigned_token}`)}
		>GO TO player</button
	>
{/if}

<form method="post">
	{#if data.isAutheticated && data.results}
		{#each data.results as result, index (result.infoHash + index)}
			<div class="border p-4">
				{result.name}
				{result.description}
				<button formaction="?/createTorrent" type="submit" name="infoHash" value={result.infoHash}>
					Add to My Torrents
				</button>
				<input type="hidden" name="cached" value={data.cacheResults.includes(result.infoHash)} />
				{#if data.cacheResults.includes(result.infoHash)}
					<span class="ml-2 rounded bg-green-100 px-2 py-1 text-green-800">Cached</span>
				{/if}
			</div>
		{/each}
	{/if}
</form>
