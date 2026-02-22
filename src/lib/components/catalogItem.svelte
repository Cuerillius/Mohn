<script lang="ts">
	import { BadgeCheck, Dot, Bookmark, Star } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import Image from '$lib/components/image.svelte';
	import { library } from '$lib/stremio/store/library';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stremio/store/auth';

	let { entry }: { entry: DiscoverItem } = $props();

	let id = $derived(entry.id ? entry.id : entry._id);

	let type = $derived(entry.type.charAt(0).toLocaleUpperCase() + entry.type.slice(1));
	let releaseInfo = $derived(
		entry.releaseInfo
			?.replace(/([-–—])\s*(\d*)/g, (match, dash, nextDigits) => {
				return nextDigits ? ` - ${nextDigits}` : ' - Today';
			})
			.trim()
	);
</script>

<div class="group relative shrink-0">
	<div
		class="pointer-events-none absolute top-1/2 left-1/2 z-40 h-full w-[250%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-background opacity-0 blur-3xl transition-opacity delay-150 duration-300 group-hover:opacity-100"
	></div>
	<button
		onclick={() => goto(`/meta/${entry.type}/${id}`)}
		class="pointer-events-none absolute top-1/2 left-1/2 z-50 flex h-96 w-84 -translate-x-1/2 -translate-y-1/2 scale-95 flex-col rounded-lg border border-accent bg-background opacity-0 shadow-2xl transition-all delay-0 duration-300 group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100 group-hover:delay-150"
	>
		<div class="relative">
			{#if entry.watched}
				<Badge variant="outline" class="absolute top-2 right-2 backdrop-blur-lg"
					><BadgeCheck class="h-4" />Watched</Badge
				>
			{/if}

			<Image class="aspect-3/2 rounded-t-lg" src={entry.background} alt={entry.name} />
			<p
				class="warp-break-words absolute right-0 bottom-0 left-0 z-10 line-clamp-3 px-4 pb-2 text-left text-xl font-bold"
			>
				{entry.name}
			</p>
			<div
				class="absolute bottom-0 h-3/4 w-full bg-linear-to-t from-background to-transparent"
			></div>
		</div>
		<div class="flex flex-wrap gap-2 px-4">
			{#each entry.links as link}
				{#if link.category === 'Genres'}
					<Badge variant="outline">{link.name}</Badge>
				{:else if link.category === 'imdb'}
					<Badge variant="outline" class="flex items-center gap-1">
						<Star class="h-3 w-3" color="yellow" fill="currentColor" />
						{link.name}
					</Badge>
				{/if}
			{/each}
		</div>
		<p class="wrap-break-words line-clamp-5 px-4 pt-2 text-left text-sm text-gray-500">
			{entry.description}
		</p>
		<div class="flex-1"></div>
		<div class="flex gap-2 p-4 pt-3">
			<Button>Details</Button>
			<Button
				disabled={!$auth.isLoggedIn}
				variant="outline"
				size="icon"
				onclick={(e) => {
					e.stopPropagation();
					entry.inLibrary ? library.removeFromLibrary(id) : library.addToLibrary(entry);
				}}><Bookmark fill={entry.inLibrary ? 'currentColor' : 'none'} /></Button
			>
			<div class="flex w-full flex-col items-center justify-center text-sm text-gray-500">
				<div class="flex">
					<p>
						{type}
					</p>
					{#if entry.releaseInfo}
						<Dot class="h-6 w-6" />
					{/if}
					<p>
						{releaseInfo}
					</p>
				</div>
			</div>
		</div>
	</button>
	<div class="relative w-48 shrink-0">
		<a href="/meta/{entry.type}/{id}">
			{#if entry.watched}
				<Badge variant="outline" class="absolute top-2 right-2 backdrop-blur-lg"
					><BadgeCheck class="h-4" />Watched</Badge
				>
			{/if}
			{#if entry.inLibrary}
				<Badge variant="outline" class="absolute top-2 left-2 h-7 backdrop-blur-lg"
					><Bookmark class="h-4" fill="currentColor" /></Badge
				>
			{/if}
			<Image
				class="mt-2 aspect-2/3 w-full rounded-lg border border-muted"
				src={entry.poster}
				alt={entry.name}
			/>

			<p class="truncate pt-2 text-start font-bold">{entry.name}</p>
			<div class="flex justify-between text-sm text-gray-500">
				<div class="flex">
					<p>
						{type}
					</p>
					{#if entry.releaseInfo}
						<Dot class="h-6 w-6" />
					{/if}
					<p>
						{releaseInfo}
					</p>
				</div>
			</div>
		</a>
	</div>
</div>
