// src/hooks.server.ts
import { redirect, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { createTorboxClient } from '$lib/server/torbox';
import { sequence } from '@sveltejs/kit/hooks';
import { db } from '$lib/server/db';

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const guardRoutes: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;
		const userSetting = await db.query.setting.findFirst({
			where: (setting, { eq }) => eq(setting.userId, event.locals.user.id)
		});
		if (userSetting?.torboxApiKey) {
			event.locals.torbox = createTorboxClient(session.user.id, userSetting?.torboxApiKey);
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.torbox = null;
	}

	const pathname = event.url.pathname;
	const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
	const isProtectedRoute = pathname.startsWith('/profiles') || pathname.startsWith('/settings');

	if (!session && isProtectedRoute) {
		throw redirect(302, `/login?redirectTo=${encodeURIComponent(pathname)}`);
	}

	if (session && isAuthPage) {
		throw redirect(302, '/');
	}

	return resolve(event);
};

export const handle: Handle = sequence(handleBetterAuth, guardRoutes);
