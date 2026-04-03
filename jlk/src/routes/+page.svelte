<script lang="ts">
  import {
    useTrending,
    usePopularMovies,
    useNowPlayingMovies,
    useTopRatedMovies,
  } from "$lib/hooks/tmdb";
  import { useProfiles } from "$lib/hooks/profiles";
  import { activeProfileId } from "$lib/stores/profile";
  import PosterRow from "$lib/components/PosterRow.svelte";
  import HeroBanner from "$lib/components/HeroBanner.svelte";
  import AvatarMarbleBackground from "$lib/components/AvatarMarbleBackground.svelte";
  import Caroussel from "$lib/components/Caroussel.svelte";
  import HeroCarousselSkeleton from "$lib/components/skeletons/heroCaroussel.svelte";

  // Fetch movies
  const trending = useTrending("movie", "week");
  const popular = usePopularMovies();
  const nowPlaying = useNowPlayingMovies();
  const topRated = useTopRatedMovies();

  // Fetch profiles to get the active one
  const profiles = useProfiles();

  // Derive the current profile based on the active ID
  let currentProfile = $derived(
    profiles.data?.find((p) => p.id === $activeProfileId),
  );

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
</script>

<div class="relative flex flex-col gap-8">
  <a
    href="/profiles"
    class="fixed top-4 right-4 md:top-8 md:right-8 z-[100] transition-transform duration-200 hover:scale-105 focus:scale-105 outline-none rounded-md"
    title="Switch Profile"
  >
    {#if currentProfile}
      <div
        class="w-10 h-10 md:w-11 md:h-11 rounded-md overflow-hidden shadow-[0_4px_12px_oklch(0_0_0_/_40%)] relative border border-white/10"
      >
        <AvatarMarbleBackground
          name={currentProfile.name}
          size={44}
          square={true}
        />
        <span
          class="absolute inset-0 flex items-center justify-center text-[0.8rem] font-bold text-white [text-shadow:_0_1px_4px_oklch(0_0_0_/_40%)] select-none"
        >
          {getInitials(currentProfile.name)}
        </span>
      </div>
    {:else}
      <!-- Skeleton while loading -->
      <div
        class="w-10 h-10 md:w-11 md:h-11 rounded-md bg-[var(--muted)] animate-pulse border border-[var(--border)]"
      ></div>
    {/if}
  </a>

  {#if popular.data}
    <Caroussel movies={popular.data?.results ?? []} />
  {:else}
    <HeroCarousselSkeleton />
  {/if}

  <PosterRow name="Popular" movies={popular.data?.results ?? []} />
  <PosterRow name="Now Playing" movies={nowPlaying.data?.results ?? []} />
  <PosterRow name="Top Rated" movies={topRated.data?.results ?? []} />
</div>
