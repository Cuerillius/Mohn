<script lang="ts">
	import { enhance, deserialize } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	let { data, form } = $props();

	// State for polling
	let torrentId = $state<string | null>(null);
	let taskStatus = $state<'idle' | 'pending' | 'completed'>('idle');
	let pollAttempts = $state(0);

	let finalFormElement = $state<HTMLFormElement | null>(null);

	// The Polling Effect
	$effect(() => {
		if (torrentId && taskStatus === 'pending') {
			const interval = setInterval(async () => {
				const formData = new FormData();
				formData.append('torrentId', torrentId!);

				const response = await fetch('?/checkStatus', {
					method: 'POST',
					body: formData
				});

				const result: ActionResult = deserialize(await response.text());

				if (result.type === 'success' && result.data) {
					if (result.data.status === 'completed') {
						taskStatus = 'completed';
						clearInterval(interval);

						// Files are ready! Trigger the final step
						setTimeout(() => {
							finalFormElement?.requestSubmit();
						}, 0);
					} else {
						// Still waiting...
						pollAttempts++;
						if (pollAttempts >= 30) {
							// Timeout after 60 seconds
							taskStatus = 'idle';
							clearInterval(interval);
							alert('Torrent files did not become available after 60 seconds.');
						}
					}
				}
			}, 2000);

			return () => clearInterval(interval); // Cleanup
		}
	});

	// Intercept the initial 'Add to My Torrents' submission
	const handleCreateTorrent = () => {
		return async ({ result, update }: { result: ActionResult; update: () => void }) => {
			if (result.type === 'success' && result.data?.torrentId) {
				torrentId = result.data.torrentId;
				taskStatus = 'pending';
				pollAttempts = 0;
			} else {
				update(); // Let SvelteKit handle normal errors naturally
			}
		};
	};
</script>

{#if !data.isAutheticated}
	<p>Please log in to see search results.</p>
{/if}

<!-- Visual feedback for the user while polling happens -->
{#if taskStatus === 'pending'}
	<div class="mb-4 rounded bg-blue-100 p-4 text-blue-800">
		Processing torrent files... (Attempt {pollAttempts}/30)
	</div>
{/if}

<!-- Auto-submitting hidden form for Step 3 -->
<!-- It natively updates the `form` prop below once it completes! -->
<form bind:this={finalFormElement} method="post" action="?/createStream" use:enhance hidden>
	<input type="hidden" name="torrentId" value={torrentId} />
</form>

<!-- Your existing stream UI remains entirely untouched -->
{#if form?.stream}
	<p>{form.stream.data.name}</p>
	<input name="torrent_id" value={form.stream.data.id} />
	<p>{JSON.stringify(form.stream, null, 2)}</p>
	<p>is it the same?</p>
	<p>{JSON.stringify(form.streamData, null, 2)}</p>
{/if}

<!-- Attach the handler to your main form -->
<form method="post" use:enhance={handleCreateTorrent}>
	{#if data.isAutheticated && data.results?.data && data.results.data.torrents}
		{#each data.results.data.torrents as result}
			<div class="border p-4">
				{result.raw_title}
				<button formaction="?/createTorrent" type="submit" name="magnet" value={result.magnet}>
					Add to My Torrents
				</button>
			</div>
		{/each}
	{/if}

	{#if data.isAutheticated && data.results?.data && data.results.data.nzbs}
		{#each data.results.data.nzbs as result}
			<div class="mb-4 rounded border p-4">
				{result.title}
			</div>
		{/each}
	{/if}
</form>
