<script lang="ts">
	let { 
		time = 0, 
		duration = 0, 
		buffered = 0,
		updateTime = (newTime: number) => {}
	} = $props();

	let isDragging = $state(false);
	let barElement: HTMLDivElement | null = null;

	function formatTime(seconds: number): string {
		if (!Number.isFinite(seconds) || seconds < 0) return "00:00:00";
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);
		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	let formattedTime = $derived(formatTime(time));
	let formattedDuration = $derived(formatTime(duration));
	
	let progressPercent = $derived((time / duration) * 100);
	let bufferedPercent = $derived((buffered / duration) * 100);

	function setSeekbarTime(clientX: number) {
		if (!barElement) return;
		const rect = barElement.getBoundingClientRect();
		const x = clientX - rect.left;
		
		const percentage = Math.max(0, Math.min(1, x / rect.width));
		let tempTime = percentage * duration;
		
		updateTime(tempTime);
	}

	function handlePointerDown(e: PointerEvent) {
		e.preventDefault(); 
		isDragging = true;
		setSeekbarTime(e.clientX);
		
		window.addEventListener('pointermove', handlePointerMove);
		window.addEventListener('pointerup', handlePointerUp);
	}

	function handlePointerMove(e: PointerEvent) {
		if (isDragging) setSeekbarTime(e.clientX);
	}

	function handlePointerUp() {
		isDragging = false;
		window.removeEventListener('pointermove', handlePointerMove);
		window.removeEventListener('pointerup', handlePointerUp);
	}
</script>

<div class="flex w-full justify-end gap-3">
	
		<span class="tabular-nums">{formattedTime}</span>
	


	<div 
		bind:this={barElement}
		class="group relative flex h-6 w-full cursor-pointer items-center select-none touch-none"
		onpointerdown={handlePointerDown}
		role="slider"
		aria-valuenow={time}
		aria-valuemin="0"
		aria-valuemax={duration}
		tabindex="0"
	>
		<div class="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
			
			<div 
				class="absolute h-full bg-white/30 transition-all duration-200 ease-out rounded-full" 
				style="width: {bufferedPercent}%"
			></div>

			<div 
				class="absolute h-full bg-white transition-all duration-75 ease-out rounded-full" 
				style="width: {progressPercent}%"
			></div>
		</div>

		<div 
			class="absolute h-3 w-3 rounded-full bg-white opacity-0 shadow ring-4 ring-white/20 transition-opacity group-hover:opacity-100"
			class:opacity-100={isDragging}
			style="left: {progressPercent}%; transform: translateX(-50%);"
		></div>
	</div>
		<span class="tabular-nums">{formattedDuration}</span>
</div>