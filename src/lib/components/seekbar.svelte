<script lang="ts">
	interface Props {
		time?: number;
		duration?: number;
		buffered?: number;
		updateTime?: (newTime: number) => void;
	}

	let { time = 0, duration = 0, buffered = 0, updateTime = () => {} }: Props = $props();

	let isDragging = $state(false);
	let barElement = $state<HTMLDivElement | null>(null);

	function formatTime(ms: number): string {
		if (!Number.isFinite(ms) || ms < 0) return '00:00:00';
		const seconds = Math.floor(ms / 1000);
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = Math.floor(seconds % 60);

		return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}

	let formattedTime = $derived(formatTime(time));
	let formattedDuration = $derived(formatTime(duration));

	let progressPercent = $derived(duration > 0 ? (time / duration) * 100 : 0);
	let bufferedPercent = $derived(duration > 0 ? (buffered / duration) * 100 : 0);

	function setSeekbarTime(clientX: number) {
		if (!barElement) return;
		const rect = barElement.getBoundingClientRect();
		const x = clientX - rect.left;

		const percentage = Math.max(0, Math.min(1, x / rect.width));
		const tempTime = percentage * duration;

		updateTime(tempTime);
	}

	function handlePointerDown(e: PointerEvent) {
		if (e.button !== 0) return;

		e.preventDefault();
		barElement?.setPointerCapture(e.pointerId);
		isDragging = true;
		setSeekbarTime(e.clientX);
	}

	function handlePointerMove(e: PointerEvent) {
		if (isDragging) setSeekbarTime(e.clientX);
	}

	function handlePointerUp(e: PointerEvent) {
		if (isDragging) {
			isDragging = false;
			barElement?.releasePointerCapture(e.pointerId);
		}
	}
</script>

<div class="flex w-full items-center justify-end gap-3 text-sm font-medium text-white/90">
	<span class="w-[8ch] text-right tabular-nums">{formattedTime}</span>

	<div
		bind:this={barElement}
		class="group relative flex h-6 w-full cursor-pointer touch-none items-center select-none"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		role="slider"
		aria-valuenow={time}
		aria-valuemin={0}
		aria-valuemax={duration}
		tabindex="0"
	>
		<div class="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20">
			<div
				class="absolute h-full rounded-full bg-white/30 transition-all duration-200 ease-out"
				style:width="{bufferedPercent}%"
			></div>

			<div
				class="absolute h-full rounded-full bg-white transition-all duration-75 ease-out"
				style:width="{progressPercent}%"
			></div>
		</div>

		<div
			class="absolute h-3 w-3 rounded-full bg-white opacity-0 shadow ring-4 ring-white/20 transition-opacity group-hover:opacity-100"
			class:opacity-100={isDragging}
			style:left="{progressPercent}%"
			style:transform="translateX(-50%)"
		></div>
	</div>

	<span class="w-[8ch] tabular-nums">{formattedDuration}</span>
</div>
