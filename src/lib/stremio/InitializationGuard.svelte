<script lang="ts">
	import { onMount } from 'svelte';
	import { getStremio } from '$lib/stremio/core';

	let { children } = $props();

	let initialized = $state(false);

	const loadingMessages = [
		'Convincing the server to work...',
		'Turning it off and on again...',
		'Untangling the interwebs...',
		'Polishing the pixels...',
		'Warming up the processors...',
		'Compiling the spaghetti code...',
		'Mining Bitcoins...',
		'Dusting off the server...',
		'Shoveling coal into the server...',
		'Moving satellites into position...',
		'Re-calibrating the internet...',
		'Fixing the flux...',
		'Routing the encryption...',
		'Updating the updater...',
		'Optimizing the optimizer...',
		'Debugging the debugger...',
		'Checking for loose cables...',
		'Asking the developer why this takes so long...',
		'Reading the manual...',
		'Counting backwards from infinity...',
		'Testing your patience...',
		'Doing a barrel roll...',
		'Looking busy...',
		'Please wait while we ignore you...',
		'Trying to remember where we put the files...',
		"Making it look like we're working...",
		'Ensuring the pixels are square...',
		'Converting caffeine into code...',
		'Wait, are you still watching?',
		"Don't panic...",
		'Hold your breath...',
		'Doing the math...',
		'Consulting the oracle...',
		'Just a moment...',
		'Almost there...',
		'Still faster than a dial-up modem...',
		'Loading 99%...',
		'Staring at the screen...',
		'Why is the loading bar moving backwards?',
		'Cleaning up the mess...',
		'Organizing the chaos...',
		'Making meaningful eye contact...',
		'Trying to look cool...',
		'Checking the gravity...',
		'Aligning the planets...',
		'Generating enthusiasm...',
		'Checking for typos...',
		'Stretching...',
		'Hydrating...'
	];

	onMount(() => {
		message = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
		const stremio = getStremio();
		const check = () => {
			if (stremio.isReady) initialized = true;
		};
		stremio.on('ready', check);
		check();
		return () => stremio.off('ready', check);
	});

	let message = $state('Please wait while we initialize the application.');
</script>

{#if initialized}
	{@render children()}
{:else}
	<div class="flex h-screen w-screen flex-col content-center items-center justify-center gap-4 p-8">
		<h1 class="text-xl font-bold">Starting Stremio Engine</h1>
		<p class="text-sm text-gray-500">{message}</p>
	</div>
{/if}
