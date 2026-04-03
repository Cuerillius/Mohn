<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { useMovieDetails } from "$lib/hooks/tmdb";
  import { ArrowLeft, Play, Clock, Star, TrendingUp } from "@lucide/svelte";

  const movieId = Number(page.params.id);
  const details = useMovieDetails(movieId);

  function formatMoney(num: number) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  }
</script>

<div class="min-h-screen bg-[var(--background)]">
  {#if details.data}
    <!-- Backdrop Header -->
    <div class="relative h-[60vh] w-full overflow-hidden">
      <img
        src="https://image.tmdb.org/t/p/original{details.data.backdrop_path}"
        alt={details.data.title}
        class="w-full h-full object-cover"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-[var(--background)/20] to-transparent"
      ></div>

      <button
        onclick={() => history.back()}
        class="absolute top-8 left-8 p-2 rounded-full bg-[var(--background)/50] backdrop-blur text-white hover:bg-[var(--background)/80] transition-all"
      >
        <ArrowLeft size={24} />
      </button>
    </div>

    <!-- Content -->
    <div
      class="absolute bottom-0 left-0 right-0 px-8 z-10 max-w-6xl mx-auto pb-20"
    >
      <div class="flex flex-col md:flex-row gap-8 items-start">
        <!-- Info -->
        <div class="flex-1 space-y-6">
          <div>
            <h1
              class="text-5xl font-bold tracking-tight text-[var(--foreground)] mb-2"
            >
              {details.data.title}
            </h1>
            <p class="text-xl text-[var(--muted-foreground)] italic">
              {details.data.tagline}
            </p>
          </div>

          <div class="flex gap-4">
            <button
              class="flex items-center gap-2 px-8 py-3 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg font-semibold hover:opacity-90"
              onclick={() => goto("/player/movie/" + details.data.imdb_id)}
            >
              <Play size={20} fill="currentColor" /> Play
            </button>
          </div>

          <p class="text-lg text-[var(--foreground)] leading-relaxed max-w-3xl">
            {details.data.overview}
          </p>

          <!-- Stats Grid -->
          <div
            class="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[var(--border)]"
          >
            <div>
              <p class="text-xs text-[var(--muted-foreground)] uppercase">
                Runtime
              </p>
              <div class="flex items-center gap-2 mt-1">
                <Clock size={16} />
                {details.data.runtime} min
              </div>
            </div>
            <div>
              <p class="text-xs text-[var(--muted-foreground)] uppercase">
                Rating
              </p>
              <div class="flex items-center gap-2 mt-1">
                <Star size={16} class="text-yellow-500" />
                {details.data.vote_average.toFixed(1)}
              </div>
            </div>
            <div>
              <p class="text-xs text-[var(--muted-foreground)] uppercase">
                Budget
              </p>
              <div class="mt-1">{formatMoney(details.data.budget)}</div>
            </div>
            <div>
              <p class="text-xs text-[var(--muted-foreground)] uppercase">
                Status
              </p>
              <div class="mt-1">{details.data.status}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
