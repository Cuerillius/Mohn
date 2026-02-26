<script lang="ts">
	let { data } = $props();
</script>

{#if !data.isAutheticated}
	<p>Please log in to see search results.</p>
{/if}

{#if data.isAutheticated && data.results}
	{#each data.results.data as result}
		<div>
			{result.title}
			{result.description}
			{result.id}
		</div>
	{/each}
{/if}
