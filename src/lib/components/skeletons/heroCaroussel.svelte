<script>
	import Skeleton from '../ui/skeleton/skeleton.svelte';
</script>

<div class="relative h-screen w-full overflow-hidden bg-background">
	<Skeleton class="h-full w-full rounded-none" />
	<div
		class="absolute inset-x-0 top-0 z-10 h-60 bg-linear-to-b from-background via-background/30 to-transparent"
	></div>
	<div
		class="absolute inset-0 z-20 bg-[radial-gradient(ellipse_at_bottom,_transparent_20%,_hsl(var(--background))_100%)] opacity-90"
	></div>
	<div
		class="absolute inset-x-0 bottom-0 z-30 h-1/2 bg-linear-to-t from-background via-background/40 to-transparent"
	></div>
	<div class="absolute bottom-1/6 left-20 z-40 flex max-w-2xl flex-col gap-6">
		<div class="flex gap-4">
			<Skeleton class="h-7 w-24 rounded-full" />
			<Skeleton class="h-7 w-32 rounded-full" />
		</div>

		<Skeleton class="h-48 w-80 rounded-lg" />

		<div class="flex gap-2">
			<Skeleton class="h-9 w-20" />
			<Skeleton class="h-9 w-24" />
			<Skeleton class="h-9 w-20" />
		</div>

		<div class="flex flex-col gap-2">
			<Skeleton class="h-4 w-120" />
			<Skeleton class="h-4 w-120" />
			<Skeleton class="h-4 w-120" />
		</div>

		<div class="flex gap-6 pt-2">
			<Skeleton class="h-12 w-40 rounded-md" />
			<Skeleton class="h-12 w-40 rounded-md" />
		</div>
	</div>

	<div class="absolute right-0 bottom-8 left-0 z-10 flex justify-center gap-2">
		<Skeleton class="h-2 w-6 rounded-full" />
		<Skeleton class="h-2 w-2 rounded-full" />
		<Skeleton class="h-2 w-2 rounded-full" />
	</div>
</div>
