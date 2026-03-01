import { db } from '$lib/server/db';
import { profile } from '$lib/server/db/profiles.schema';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

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
	}
};
