<script lang="ts">
	import { goto } from '$app/navigation';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import { auth } from '$lib/stremio/store/auth';
	import { localSearch } from '$lib/stremio/store/localSearch';
	import { CornerDownLeft, SearchIcon, History, Search } from 'lucide-svelte';
	import {  onMount, tick } from 'svelte';

	let searchQuery = $state('');
	let isFocused = $state(false);

	let formRef: HTMLFormElement | undefined = $state();
	let dropdownStyle = $state('');

	let showHistory = $derived(searchQuery.trim().length === 0);
	let displayResults = $derived(
		showHistory ? ($auth.searchHistory ?? []) : ($localSearch.results ?? [])
	);

	onMount(() => {
		localSearch.load();
	});

	function updatePosition() {
		if (formRef) {
			const rect = formRef.getBoundingClientRect();

			dropdownStyle = `top: ${rect.bottom + 8}px; left: ${rect.left}px; width: ${rect.width}px;`;
		}
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		updatePosition();

		window.addEventListener('resize', updatePosition);
		window.addEventListener('scroll', updatePosition, true);

		return {
			destroy() {
				if (node.parentNode) node.parentNode.removeChild(node);
				window.removeEventListener('resize', updatePosition);
				window.removeEventListener('scroll', updatePosition, true);
			}
		};
	}

	function onSearch() {
		if (!searchQuery) return;
		goto(`/search?query=${encodeURIComponent(searchQuery)}`);
		isFocused = false;
	}

	function selectResult(query: string) {
		searchQuery = query;
		onSearch();
	}

	function handleBlur() {
		setTimeout(() => {
			isFocused = false;
		}, 150);
	}
</script>

<form
	bind:this={formRef}
	class="relative w-full max-w-lg"
	onsubmit={(e) => {
		e.preventDefault();
		onSearch();
	}}
>
	<InputGroup.Root>
		<InputGroup.Addon>
			<SearchIcon class="h-4 w-4 text-muted-foreground" />
		</InputGroup.Addon>
		<InputGroup.Input
			placeholder="Type to search..."
			bind:value={searchQuery}
			class="bg-transparent pl-10 focus-visible:ring-0"
			oninput={() => {
				localSearch.search(searchQuery);
				updatePosition();
			}}
			onfocus={() => {
				isFocused = true;
				tick().then(updatePosition);
			}}
			onblur={handleBlur}
		/>
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button type="submit" variant="ghost" onclick={onSearch}>
				<CornerDownLeft class="h-4 w-4" />
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>

	{#if isFocused && displayResults.length > 0}
		<div
			use:portal
			style={dropdownStyle}
			class="fixed z-1000 overflow-hidden rounded-xl border border-border bg-background/40 text-white shadow-2xl backdrop-blur-xl"
			role="listbox"
		>
			<div class="max-h-75 overflow-y-auto p-1">
				{#each displayResults as result}
					{@const resultText = typeof result === 'string' ? result : result.query}
					<button
						type="button"
						class="relative flex w-full cursor-default items-center rounded-lg px-3 py-2 text-sm outline-none select-none hover:bg-white/10"
						onclick={() => selectResult(resultText)}
					>
						{#if showHistory}
							<History class="mr-3 h-4 w-4 opacity-50" />
						{:else}
							<Search class="mr-3 h-4 w-4 opacity-50" />
						{/if}
						<span class="truncate">{resultText}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</form>
