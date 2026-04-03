<script lang="ts">
    import { goto } from "$app/navigation";
    import { useProfiles } from "$lib/hooks/profiles";
    import { activeProfileId } from "$lib/stores/profile";
    import { Settings } from "@lucide/svelte";
    import type { Profile } from "$lib/api/profiles";
    import AvatarMarbleBackground from "$lib/components/AvatarMarbleBackground.svelte";

    const profiles = useProfiles();

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function selectProfile(profile: Profile) {
        activeProfileId.select(profile.id);
        goto("/");
    }
</script>

<div
    class="min-h-screen relative flex flex-col items-center justify-center bg-[var(--background)] p-8"
>
    <!-- Top Right Manage Button -->
    <a
        href="/profiles/settings"
        class="absolute top-8 right-8 p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[oklch(1_0_0_/_5%)] rounded-lg transition-all"
        title="Manage Profiles"
        id="manage-profiles-btn"
    >
        <Settings size={20} />
    </a>

    <div class="flex flex-col items-center gap-12 max-w-4xl w-full">
        <h1
            class="text-[2.5rem] font-medium text-[var(--foreground)] tracking-tighter"
        >
            Who's watching?
        </h1>

        {#if profiles.isPending}
            <div class="flex flex-wrap justify-center gap-8">
                {#each Array(3) as _}
                    <div class="flex flex-col items-center gap-3.5">
                        <div
                            class="w-36 h-36 rounded-2xl bg-[var(--muted)] animate-pulse"
                        ></div>
                        <div
                            class="w-20 h-4 rounded bg-[var(--muted)] animate-pulse"
                        ></div>
                    </div>
                {/each}
            </div>
        {:else if profiles.isError}
            <p class="text-[var(--destructive)] text-sm">
                Failed to load profiles.
            </p>
        {:else if profiles.data}
            <div class="flex flex-wrap justify-center gap-8">
                {#each profiles.data as profile, i}
                    <button
                        class="flex flex-col items-center gap-3.5 cursor-pointer bg-transparent border-none p-0 transition-transform duration-200 hover:scale-105 group"
                        onclick={() => selectProfile(profile)}
                        id="profile-card-{profile.id}"
                    >
                        <div
                            class="w-36 h-36 rounded-2xl overflow-hidden shadow-[0_4px_20px_oklch(0_0_0_/_25%)] transition-all duration-200 group-hover:shadow-[0_0_0_3px_var(--foreground),_0_8px_32px_oklch(0_0_0_/_40%)] relative"
                        >
                            <AvatarMarbleBackground
                                name={profile.name}
                                size={144}
                                square={true}
                            />
                            <span
                                class="absolute inset-0 flex items-center justify-center text-[2.25rem] font-bold text-white [text-shadow:_0_2px_8px_oklch(0_0_0_/_30%)] select-none"
                            >
                                {getInitials(profile.name)}
                            </span>
                        </div>
                        <span
                            class="text-base font-medium text-[var(--muted-foreground)] transition-colors duration-200 group-hover:text-[var(--foreground)] max-w-[9rem] overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                            {profile.name}
                        </span>
                    </button>
                {/each}
            </div>
        {/if}
    </div>
</div>
