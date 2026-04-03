<script lang="ts">
    import { goto } from "$app/navigation";
    import { authClient, session } from "$lib/api/auth-client";

    let email = $state("");
    let password = $state("");
    let error = $state("");

    async function login(e: Event) {
        e.preventDefault(); // Prevent form submission reload
        if (email !== "" && password !== "") {
            error = "";
            const { data, error: authError } = await authClient.signIn.email({
                email,
                password,
                callbackURL: "/profiles",
            });

            if (authError) {
                error = authError.message || "Invalid email or password";
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
                Welcome back
            </h1>
            <p class="text-sm text-[var(--muted-foreground)]">
                Sign in to your account
            </p>
        </div>

        <form
            class="flex flex-col gap-4 bg-[oklch(1_0_0_/_3%)] p-6 rounded-xl border border-[var(--border)]"
            onsubmit={login}
        >
            <div class="flex flex-col gap-1.5">
                <label
                    for="email"
                    class="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider"
                    >Email</label
                >
                <input
                    type="email"
                    bind:value={email}
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
                Login
            </button>
        </form>

        <div class="text-center">
            <a
                href="/signup"
                class="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
                Don't have an account? <span
                    class="underline underline-offset-4">Sign up</span
                >
            </a>
        </div>
    </div>
</div>
