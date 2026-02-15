<script>
	import Skeleton from '../ui/skeleton/skeleton.svelte';
	import DetailBlockSkeleton from './detailBlock.svelte';
</script>

<div class="relative h-screen w-full overflow-hidden bg-background">
	<Skeleton class="absolute inset-0 h-full w-full rounded-none" />
	<div class="absolute bottom-20 left-20 z-40 w-full max-w-2xl space-y-6">
		<DetailBlockSkeleton />
		<div class="flex gap-6 pt-4">
			<Skeleton class="h-14 w-48 rounded-xl" />
			<Skeleton class="h-14 w-40 rounded-xl" />
		</div>
	</div>
</div>
