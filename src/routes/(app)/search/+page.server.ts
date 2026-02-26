import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	let results = null;
	if (event.locals.user && event.locals.torbox) {
		const query = event.url.searchParams.get('q');

		if (!query) {
			return { results: [] };
		}

		const torbox = event.locals.torbox;

		results = await torbox.search.findQuery(query);
	}
	return { results, isAutheticated: !!event.locals.user };
};
