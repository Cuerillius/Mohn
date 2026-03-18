<script lang="ts">
  let id = $state("");
  let type = $state("movie");
</script>

<main class="container">
  <h1>Welcome to Tauri + Svelte + mpv</h1>

  <a href="/player/{type}/{id}">Go to Player</a>
</main>
<input bind:value={type} placeholder="Enter a type to play in the player..." />
<input bind:value={id} placeholder="Enter a id to play in the player..." />
