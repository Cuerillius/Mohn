<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		icon: Icon,
		title,
		description,
		layout = 'container',
		titleClass = 'text-xl font-bold',
		descriptionClass = 'text-gray-500',
		children
	}: {
		icon: any;
		title: string;
		description?: string;
		layout?: 'container' | 'fullscreen';
		titleClass?: string;
		descriptionClass?: string;
		children?: Snippet;
	} = $props();
</script>

<div
	class="flex flex-col items-center justify-center gap-4 p-8 text-center
	{layout === 'fullscreen' ? 'h-dvh w-full' : ''}"
>
	<div class="rounded-lg border p-3">
		<Icon class="h-8 w-8" />
	</div>

	<h1 class={titleClass}>{title}</h1>

	{#if description}
		<p class={`max-w-sm text-sm text-balance ${descriptionClass}`}>
			{description}
		</p>
	{/if}

	{#if children}
		<div class="mt-2 flex items-center justify-center gap-2">
			{@render children()}
		</div>
	{/if}
</div>
