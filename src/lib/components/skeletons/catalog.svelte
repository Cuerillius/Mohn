<script>
	import Skeleton from '../ui/skeleton/skeleton.svelte';
</script>

<div class="flex flex-col px-20">
	<div class="flex items-center gap-4">
		<Skeleton class="h-8 w-48" />
		<div class="flex gap-2">
			<Skeleton class="h-6 w-16 rounded-full" />
			<Skeleton class="h-6 w-24 rounded-full" />
		</div>
	</div>
	<Skeleton class="mt-2 h-4 w-20" />

	<div class="flex w-full gap-8 overflow-hidden pt-6">
		{#each { length: 10 } as _}
			<div class="flex w-48 shrink-0 flex-col gap-2">
				<Skeleton class="aspect-2/3 w-full rounded-lg" />

				<Skeleton class="h-4 w-3/4" />
				<div class="flex items-center gap-2">
					<Skeleton class="h-3 w-1/4" />
					<Skeleton class="h-3 w-1/3" />
				</div>
			</div>
		{/each}
	</div>
</div>
