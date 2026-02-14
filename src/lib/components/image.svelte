<script lang="ts">
	import { cn, type WithElementRef } from '$lib/utils';
	import type { HTMLImgAttributes } from 'svelte/elements';
	import { ImageOff } from 'lucide-svelte';

	let {
		class: className,
		ref = $bindable(null),
		src,
		alt,
		...restProps
	}: WithElementRef<HTMLImgAttributes> = $props();
	let imageError = $state(false);

	$effect(() => {
		if (src) imageError = false;
	});
</script>

{#if src && !imageError}
	<img {src} onerror={() => (imageError = true)} {...restProps} class={className} />
{:else}
	<div class={cn('flex w-full flex-col items-center justify-center bg-muted', className)}>
		<ImageOff class="h-8 w-8 text-gray-500" />
		<p class="mt-2 text-center text-xs font-medium text-gray-500">No image</p>
	</div>
{/if}
