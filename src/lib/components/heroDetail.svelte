<script lang="ts">
	import Image from '$lib/components/image.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import ImageVignete from './imageVignete.svelte';
	import { Info, Play } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import DetailBlock from './detailBlock.svelte';

	let {
		item,
		catalog
	}: {
		item: DiscoverItem;
		catalog?: Catalog;
	} = $props();
</script>

<div class="relative h-screen w-full overflow-hidden">
	<Image src={item.background} alt={item.name} class="h-full w-full object-cover" />
	<ImageVignete />

	<div class="absolute bottom-20 left-20 z-40 max-w-2xl">
		<DetailBlock {item} {catalog} />
		<div class="flex gap-6">
			<Button variant="default" class="p-6" onclick={() => goto(`/meta/${item.type}/${item.id}`)}
				><Play />Watch Now</Button
			>
			<Button variant="outline" class="p-6" onclick={() => goto(`/meta/${item.type}/${item.id}`)}
				><Info />More Info</Button
			>
		</div>
	</div>
</div>
