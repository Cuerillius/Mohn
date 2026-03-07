<script lang="ts">
	import 'vidstack/bundle';
	const { data } = $props();
</script>

<media-player title={data?.result?.data.name || 'Unknown'} src={data?.result?.data.hls_url || ''}>
	<media-provider></media-provider>
</media-player>

{#each data.result?.data.metadata.audios as audio (audio.index)}
	<div>
		<p>Audio Track: {audio.language} ({audio.codec})</p>
	</div>
{/each}

{#each data.result?.data.metadata.subtitles as subtitle (subtitle.index)}
	<div>
		<p>Subtitle Track: {subtitle.language} ({subtitle.codec})</p>
	</div>
{/each}

{#each data.result?.data.metadata.audios as audio (audio.index)}
	<div>
		<p>Audio Track: {audio.language} ({audio.codec})</p>
	</div>
{/each}

<pre>{JSON.stringify(data, null, 2)}</pre>
