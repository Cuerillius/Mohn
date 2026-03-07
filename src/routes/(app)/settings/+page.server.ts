import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/profiles.schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { addons, setting } from '$lib/server/db/schema';

export const load: PageServerLoad = async (event) => {
	const userProfiles = await db.query.profile.findMany({
		where: (profiles, { eq }) => eq(profiles.userId, event.locals.user.id),
		orderBy: (profiles, { asc }) => [asc(profiles.createdAt)]
	});

	return { userProfiles };
};

export const actions: Actions = {
	createProfile: async (event) => {
		const formData = await event.request.formData();
		const name = formData.get('name')?.toString() ?? 'New Profile';

		const profiles = await db.query.profile.findMany({
			where: (profiles, { eq }) => eq(profiles.userId, event.locals.user.id)
		});

		if (profiles.length >= 10) {
			throw new Error('Maximum number of profiles (10) reached');
		}

		await db.insert(profile).values({
			name,
			userId: event.locals.user.id
		});
	},
	deleteProfile: async (event) => {
		const formData = await event.request.formData();
		const profileId = formData.get('profileId')?.toString();
		if (!profileId) {
			throw new Error('Profile ID is required');
		}
		const profiles = await db.query.profile.findMany({
			where: (profiles, { eq }) => eq(profiles.userId, event.locals.user.id)
		});

		if (profiles.length <= 1) {
			throw new Error('At least one profile is required');
		}

		await db.delete(profile).where(eq(profile.id, profileId));
	},
	updateTorboxApiKey: async (event) => {
		const formData = await event.request.formData();
		const apiKey = formData.get('torboxApiKey')?.toString() ?? '';

		const existingSetting = await db.query.setting.findFirst({
			where: (setting, { eq }) => eq(setting.userId, event.locals.user.id)
		});

		if (existingSetting) {
			await db
				.update(setting)
				.set({ torboxApiKey: apiKey })
				.where(eq(setting.userId, event.locals.user.id));
		} else {
			await db.insert(setting).values({
				torboxApiKey: apiKey,
				userId: event.locals.user.id
			});
		}
	},
	addAddon: async (event) => {
		const formData = await event.request.formData();
		const addonUrl = formData.get('addonUrl')?.toString() ?? '';
		if (!addonUrl) {
			throw new Error('Addon URL is required');
		}

		await db.insert(addons).values({
			manifest: addonUrl,
			userId: event.locals.user.id
		});
	}
};
