	import { db } from '$lib/server/db';
	import type { PageServerLoad } from './$types';

	export const load: PageServerLoad = async (event) => {
		const userProfiles = await db.query.profile.findMany({
			where: (profiles, { eq }) => eq(profiles.userId, event.locals.user.id),
			orderBy: (profiles, { asc }) => [asc(profiles.createdAt)]
		});

		return { userProfiles };
	};


