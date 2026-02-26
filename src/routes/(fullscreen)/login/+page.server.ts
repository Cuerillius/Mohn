import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async (event) => {
	const next = event.url.searchParams.get('redirectTo') || '/profiles';
	if (event.locals.user) {
		return redirect(302, next);
	}
	return { next };
};

export const actions: Actions = {
	signInEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const next = event.url.searchParams.get('redirectTo') || '/profiles';

		try {
			await auth.api.signInEmail({
				body: {
					email,
					password,
					callbackURL: next
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Signin failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}
	},
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const name = formData.get('name')?.toString() ?? '';
		const next = event.url.searchParams.get('redirectTo') || '/profiles';

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name,
					callbackURL: next
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}
	},
	signInGoogle: async (event) => {
		const next = event.url.searchParams.get('redirectTo') || '/profiles';
		let result = null;
		try {
			result = await auth.api.signInSocial({
				body: {
					provider: 'google',
					callbackURL: next
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Signin failed' });
			}
			return fail(500, { message: 'Unexpected error' });
		}
		if (result.url) {
			return redirect(302, result.url);
		}
	}
};
