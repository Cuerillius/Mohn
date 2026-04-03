<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient, session } from "$lib/api/auth-client";

    let name = $state("");
    let email = $state("");
    let password = $state("");
    let error = $state("");

    async function signUp(e: Event) {
        e.preventDefault();
        if (email !== "" && password !== "" && name !== "") {
            error = "";
            try {
                const { error: authError } = await authClient.signUp.email({
                    name,
                    email,
                    password,
                    callbackURL: "/profiles",
                });

                if (authError) {
                    error = authError.message || "Invalid input";
                }
            } catch (e) {
                error = "An unexpected error occurred";
                console.error(e);
            }
        } else {
            error = "Please fill in all fields";
        }
    }

    $effect(() => {
        if ($session.data?.user) {
            goto("/profiles");
        }
    });
</script>

<div
    class="min-h-screen flex items-center justify-center bg-[var(--background)] p-8"
>
    <div class="w-full max-w-sm flex flex-col gap-6">
        <div class="text-center space-y-2">
            <h1 class="text-2xl font-semibold text-[var(--foreground)]">
                Create an account
            </h1>
            <p class="text-sm text-[var(--muted-foreground)]">
                Get started with your profile
            </p>
        </div>

        <form
            class="flex flex-col gap-4 bg-[oklch(1_0_0_/_3%)] p-6 rounded-xl border border-[var(--border)]"
            onsubmit={signUp}
        >
            <div class="flex flex-col gap-1.5">
                <label
                    for="name"
                    class="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
                    >Name</label
                >
                <input
                    type="text"
                    bind:value={name}
                    name="name"
                    class="w-full p-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md outline-none focus:border-[oklch(0.6_0.2_260)] focus:ring-1 focus:ring-[oklch(0.6_0.2_260)] transition-all"
                />
            </div>

            <div class="flex flex-col gap-1.5">
                <label
                    for="email"
                    class="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
                    >Email</label
                >
                <input
                    type="email"
                    bind:value={email}
                    name="email"
                    class="w-full p-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md outline-none focus:border-[oklch(0.6_0.2_260)] focus:ring-1 focus:ring-[oklch(0.6_0.2_260)] transition-all"
                />
            </div>

            <div class="flex flex-col gap-1.5">
                <label
                    for="password"
                    class="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
                    >Password</label
                >
                <input
                    type="password"
                    bind:value={password}
                    name="password"
                    class="w-full p-2.5 text-sm bg-[var(--background)] border border-[var(--border)] rounded-md outline-none focus:border-[oklch(0.6_0.2_260)] focus:ring-1 focus:ring-[oklch(0.6_0.2_260)] transition-all"
                />
            </div>

            {#if error}
                <p class="text-xs text-[var(--destructive)] font-medium">
                    {error}
                </p>
            {/if}

            <button
                type="submit"
                class="mt-2 w-full py-2.5 text-sm font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] rounded-lg hover:opacity-90 transition-all shadow-md"
            >
                Sign up
            </button>
        </form>

        <div class="text-center">
            <a
                href="/login"
                class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
                Already have an account? <span
                    class="underline underline-offset-4">Login</span
                >
            </a>
        </div>
    </div>
</div>
