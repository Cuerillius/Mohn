<script lang="ts">
    import { goto } from "$app/navigation";
    import {
        useProfiles,
        useCreateProfile,
        useRenameProfile,
        useDeleteProfile,
        useReorderProfiles,
    } from "$lib/hooks/profiles";
    import {
        ArrowLeft,
        Pencil,
        Trash2,
        ChevronUp,
        ChevronDown,
        Plus,
        Check,
        X,
        Loader2,
    } from "@lucide/svelte";
    import type { Profile } from "$lib/api/profiles";
    import AvatarMarble from "$lib/components/AvatarMarbleBackground.svelte";

    const profiles = useProfiles();
    const createProfileMutation = useCreateProfile();
    const renameProfileMutation = useRenameProfile();
    const deleteProfileMutation = useDeleteProfile();
    const reorderProfilesMutation = useReorderProfiles();

    let editingId = $state<string | null>(null);
    let editingName = $state("");
    let newProfileName = $state("");
    let showAddForm = $state(false);
    let confirmDeleteId = $state<string | null>(null);

    function startEditing(profile: Profile) {
        editingId = profile.id;
        editingName = profile.name;
    }

    function getInitials(name: string): string {
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }

    function cancelEditing() {
        editingId = null;
        editingName = "";
    }

    function submitRename() {
        if (!editingId || !editingName.trim()) return;
        renameProfileMutation.mutate(
            { profileId: editingId, name: editingName.trim() },
            { onSuccess: () => cancelEditing() },
        );
    }

    function handleRenameKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") submitRename();
        if (e.key === "Escape") cancelEditing();
    }

    function startAdd() {
        showAddForm = true;
        newProfileName = "";
    }

    function cancelAdd() {
        showAddForm = false;
        newProfileName = "";
    }

    function submitAdd() {
        if (!newProfileName.trim()) return;
        createProfileMutation.mutate(newProfileName.trim(), {
            onSuccess: () => cancelAdd(),
        });
    }

    function handleAddKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") submitAdd();
        if (e.key === "Escape") cancelAdd();
    }

    function confirmDelete(profileId: string) {
        confirmDeleteId = profileId;
    }

    function cancelDelete() {
        confirmDeleteId = null;
    }

    function submitDelete() {
        if (!confirmDeleteId) return;
        deleteProfileMutation.mutate(confirmDeleteId, {
            onSuccess: () => (confirmDeleteId = null),
        });
    }

    function moveProfile(index: number, direction: -1 | 1) {
        if (!profiles.data) return;
        const list = [...profiles.data];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= list.length) return;

        [list[index], list[targetIndex]] = [list[targetIndex], list[index]];
        reorderProfilesMutation.mutate(list.map((p) => p.id));
    }
</script>

<svelte:head>
    <title>Manage Profiles — JLK</title>
</svelte:head>

<div
    class="min-h-screen flex items-center justify-center bg-[var(--background)] p-8"
>
    <div class="flex flex-col items-center gap-8 max-w-lg w-full">
        <!-- Header -->
        <div class="flex items-center gap-4 w-full">
            <button
                class="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-[oklch(1_0_0_/_5%)] transition-all flex-shrink-0"
                onclick={() => goto("/profiles")}
                id="back-to-profiles"
            >
                <ArrowLeft size={20} />
            </button>
            <h1
                class="text-[1.75rem] font-medium text-[var(--foreground)] tracking-tighter"
            >
                Manage Profiles
            </h1>
        </div>

        <!-- Profile list -->
        <div
            class="w-full flex flex-col border border-[var(--border)] rounded-xl overflow-hidden bg-[oklch(1_0_0_/_3%)]"
        >
            {#if profiles.isPending}
                {#each Array(2) as _}
                    <div class="flex items-center gap-4 p-[0.875rem_1.25rem]">
                        <div
                            class="w-11 h-11 rounded-lg bg-[var(--muted)] animate-pulse"
                        ></div>
                        <div
                            class="w-32 h-4 rounded bg-[var(--muted)] animate-pulse"
                        ></div>
                    </div>
                {/each}
            {:else if profiles.isError}
                <p class="p-4 text-[var(--destructive)] text-sm">
                    Failed to load profiles.
                </p>
            {:else if profiles.data}
                {#each profiles.data as profile, i (profile.id)}
                    <div
                        class="flex items-center gap-4 p-[0.875rem_1.25rem] border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[oklch(1_0_0_/_5%)] {editingId ===
                            profile.id || confirmDeleteId === profile.id
                            ? 'bg-[oklch(1_0_0_/_5%)]'
                            : ''}"
                    >
                        <div
                            class="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative border border-[var(--border)]"
                        >
                            <AvatarMarble
                                name={profile.name}
                                size={44}
                                square={true}
                            />
                            <span
                                class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white [text-shadow:_0_1px_4px_oklch(0_0_0_/_25%)] select-none"
                            >
                                {getInitials(profile.name)}
                            </span>
                        </div>
                        {#if editingId === profile.id}
                            <div class="flex-1 flex items-center gap-2">
                                <input
                                    type="text"
                                    class="flex-1 p-[0.5rem_0.75rem] text-sm font-medium text-[var(--foreground)] bg-[var(--background)] border border-[var(--border)] rounded-md outline-none focus:border-[oklch(0.6_0.2_260)] focus:ring-2 focus:ring-[oklch(0.6_0.2_260_/_20%)]"
                                    bind:value={editingName}
                                    onkeydown={handleRenameKeydown}
                                />
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[#22c55e] hover:bg-[oklch(0.55_0.15_145_/_15%)]"
                                    onclick={submitRename}
                                    disabled={renameProfileMutation.isPending}
                                >
                                    {#if renameProfileMutation.isPending}<Loader2
                                            size={16}
                                            class="animate-spin"
                                        />{:else}<Check size={16} />{/if}
                                </button>
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[oklch(1_0_0_/_8%)]"
                                    onclick={cancelEditing}
                                    ><X size={16} /></button
                                >
                            </div>
                        {:else if confirmDeleteId === profile.id}
                            <div class="flex-1 flex items-center gap-2">
                                <span
                                    class="flex-1 text-sm font-medium text-[var(--destructive)]"
                                    >Delete "{profile.name}"?</span
                                >
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--destructive)] hover:bg-[oklch(0.6_0.2_25_/_15%)]"
                                    onclick={submitDelete}
                                    disabled={deleteProfileMutation.isPending}
                                >
                                    {#if deleteProfileMutation.isPending}<Loader2
                                            size={16}
                                            class="animate-spin"
                                        />{:else}<Check size={16} />{/if}
                                </button>
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[oklch(1_0_0_/_8%)]"
                                    onclick={cancelDelete}
                                    ><X size={16} /></button
                                >
                            </div>
                        {:else}
                            <span
                                class="flex-1 text-[0.9375rem] font-medium text-[var(--foreground)] overflow-hidden text-ellipsis whitespace-nowrap"
                                >{profile.name}</span
                            >
                            <div class="flex gap-1 ml-auto">
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[oklch(1_0_0_/_8%)] disabled:opacity-30"
                                    onclick={() => moveProfile(i, -1)}
                                    disabled={i === 0 ||
                                        reorderProfilesMutation.isPending}
                                    ><ChevronUp size={16} /></button
                                >
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[oklch(1_0_0_/_8%)] disabled:opacity-30"
                                    onclick={() => moveProfile(i, 1)}
                                    disabled={i ===
                                        (profiles.data?.length ?? 0) - 1 ||
                                        reorderProfilesMutation.isPending}
                                    ><ChevronDown size={16} /></button
                                >
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[oklch(1_0_0_/_8%)]"
                                    onclick={() => startEditing(profile)}
                                    ><Pencil size={16} /></button
                                >
                                <button
                                    class="w-8 h-8 flex items-center justify-center rounded-md text-[var(--muted-foreground)] hover:text-[var(--destructive)] hover:bg-[oklch(0.6_0.2_25_/_15%)] disabled:opacity-30"
                                    onclick={() => confirmDelete(profile.id)}
                                    disabled={(profiles.data?.length ?? 0) <= 1}
                                    ><Trash2 size={16} /></button
                                >
                            </div>
                        {/if}
                    </div>
                {/each}
            {/if}

            <!-- Add profile form -->
            {#if showAddForm}
                <div class="flex items-center gap-4 p-[0.875rem_1.25rem]">
                    <div
                        class="w-11 h-11 rounded-lg flex items-center justify-center bg-[var(--muted)] text-[var(--muted-foreground)]"
                    >
                        <Plus size={20} />
                    </div>
                    <div class="flex-1 flex items-center gap-2">
                        <input
                            type="text"
                            class="flex-1 p-[0.5rem_0.75rem] text-sm bg-[var(--background)] border border-[var(--border)] rounded-md outline-none focus:border-[oklch(0.6_0.2_260)]"
                            placeholder="Profile name"
                            bind:value={newProfileName}
                            onkeydown={handleAddKeydown}
                        />
                        <button
                            class="w-8 h-8 flex items-center justify-center text-[#22c55e]"
                            onclick={submitAdd}
                            disabled={createProfileMutation.isPending}
                        >
                            {#if createProfileMutation.isPending}<Loader2
                                    size={16}
                                    class="animate-spin"
                                />{:else}<Check size={16} />{/if}
                        </button>
                        <button
                            class="w-8 h-8 flex items-center justify-center"
                            onclick={cancelAdd}><X size={16} /></button
                        >
                    </div>
                </div>
            {/if}
        </div>

        {#if !showAddForm}
            <button
                class="inline-flex items-center gap-2 p-[0.75rem_1.75rem] text-sm font-semibold text-[var(--foreground)] border border-dashed border-[var(--border)] rounded-[0.625rem] hover:border-[var(--foreground)] hover:bg-[oklch(1_0_0_/_5%)] transition-all hover:-translate-y-px disabled:opacity-40"
                onclick={startAdd}
                disabled={(profiles.data?.length ?? 0) >= 10}
            >
                <Plus size={18} /> Add Profile
            </button>
        {/if}

        <button
            class="p-[0.75rem_3rem] text-[0.9375rem] font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 hover:-translate-y-px transition-all shadow-lg"
            onclick={() => goto("/profiles")}
        >
            Done
        </button>
    </div>
</div>
