import type { TorboxClient } from '$lib/server/torbox';
import type { User, Session } from 'better-auth/minimal';
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		interface Locals {
			user: User | null;
			session: Session | null;
			torbox: TorboxClient | null;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
	}
}

export {};
