<script lang="ts">
    import "../app.css";
    import { page } from "$app/state";
    import { goto } from "$app/navigation";
    import { session } from "$lib/api/auth-client";
    import { QueryClient, QueryClientProvider } from "@tanstack/svelte-query";

    let { children } = $props();

    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5,
                retry: 1,
            },
        },
    });

    $effect(() => {
        const path = page.url.pathname;
        const isAuthPage = path === "/login" || path === "/signup";

        if (!isAuthPage && !$session.data?.user && !$session.isPending) {
            goto("/login");
        }
    });
</script>

<QueryClientProvider client={queryClient}>
    {@render children()}
</QueryClientProvider>
