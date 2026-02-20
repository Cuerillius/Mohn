<script>
	import { ArrowLeft, OctagonAlert } from 'lucide-svelte';
	import './layout.css';
	import EmptyState from '$lib/components/emptyState.svelte';
</script>

<EmptyState
	icon={OctagonAlert}
	layout="fullscreen"
	title="404 Page not found"
	titleClass="text-4xl font-bold"
	description="It seems like you took a wrong turn. The page you are looking for does not exist."
>
	<a href="/" class="flex items-center gap-1 text-gray-500 transition-colors hover:text-white">
		<ArrowLeft class="h-4 w-4" /> Go back to home
	</a>
</EmptyState>
