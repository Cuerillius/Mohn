<script lang="ts">
	import Skeleton from '../ui/skeleton/skeleton.svelte';
</script>

<div class="w-full">
	<div class="mb-2 flex gap-4">
		<Skeleton class="h-7 w-28 rounded-md" />
		<Skeleton class="h-7 w-24 rounded-md" />
		<Skeleton class="h-7 w-24 rounded-md" />
	</div>

	<Skeleton class="h-48 w-64 rounded-xl" />

	<div class="mt-2 flex gap-2">
		<Skeleton class="h-9 w-20 rounded-md" />
		<Skeleton class="h-9 w-24 rounded-md" />
		<Skeleton class="h-9 w-16 rounded-md" />
	</div>

	<div class="my-4 flex items-center gap-2">
		<Skeleton class="h-4 w-12" />
		<div class="w-2"></div>
		<Skeleton class="h-4 w-20" />
	</div>

	<div class="mb-6 flex flex-col gap-2">
		<Skeleton class="h-4 w-120 max-w-full" />
		<Skeleton class="h-4 w-110 max-w-[90%]" />
		<Skeleton class="h-4 w-80 max-w-[70%]" />
	</div>
</div>
