<script lang="ts">
    import { onMount } from 'svelte';
    import { getStremio } from '$lib/stremio/core';
    let initialized = false;

    onMount(() => {
        const stremio = getStremio();
        const check = () => {
            if (stremio.isReady) initialized = true;
        };
        stremio.on('ready', check);
        check();
        return () => stremio.off('ready', check);
    });
</script>

{#if initialized}
    <slot />
{:else}
    <div class="spinner">Starting Stremio Engine...</div>
{/if}