import { db } from '$lib/server/db';
import { getStreams } from '$lib/server/db/addon';
import { autoSelectVideoFile } from '$lib/server/utils/videoDetection';
import type { AddonResults } from '$lib/types/addon';
import { info } from 'console';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	let results: AddonResults[] = [];
	let cacheResults: any[] = [];
	if (event.locals.user && event.locals.torbox) {
		const query = event.url.searchParams.get('q');

		if (!query) {
			return { results: [] };
		}

		const addons = await db.query.addons.findMany({
			where: (addons, { eq }) => eq(addons.userId, event.locals.user.id)
		});

		const torbox = event.locals.torbox;

		const allResults = await Promise.all(
			addons.map(async (addon) => {
				const addonResults = await getStreams(addon.manifest, 'movie', query);
				const cache = await torbox.torrents.checkCache(
					(Array.isArray(addonResults.streams)
						? addonResults.streams.map((item) => item.infoHash)
						: []) || []
				);
				return { addonResults, cache };
			})
		);
		results = allResults.flatMap((item) => item.addonResults.streams);
		cacheResults = allResults.flatMap((item) => item.cache.data.map((torrent) => torrent.hash));
	}
	return { results, isAutheticated: !!event.locals.user, cacheResults };
};

export const actions: Actions = {
	createTorrent: async (event) => {
		const formData = await event.request.formData();
		const infoHash = formData.get('infoHash')?.toString() ?? '';

		if (!event.locals.user || !event.locals.torbox) {
			return { success: false, error: 'User not authenticated' };
		}

		const torbox = event.locals.torbox;
		const res = await torbox.torrents.createTorrentFromInfoHash(infoHash);

		return { success: true, torrentId: res.data.torrent_id };
	},

	checkStatus: async (event) => {
		const formData = await event.request.formData();
		const torrentId = formData.get('torrentId')?.toString() ?? '';

		if (!event.locals.torbox) return { status: 'error' };

		const torbox = event.locals.torbox;
		const data = await torbox.torrents.getTorrentData(torrentId);

		if (data.data?.files && data.data.files.length > 0) {
			return { status: 'completed' };
		}

		return { status: 'pending', state: data.data?.download_state };
	},

	createStream: async (event) => {
		const formData = await event.request.formData();
		const torrentId = formData.get('torrentId')?.toString() ?? '';

		if (!event.locals.torbox) return { status: 'error' };
		const torbox = event.locals.torbox;

		const data = await torbox.torrents.getTorrentData(torrentId);

		if (!data.data?.files || data.data.files.length === 0) {
			return { success: false, error: 'Files not ready' };
		}

		const selectedFile = autoSelectVideoFile(data.data.files) || data.data.files[0];
		const stream = await torbox.stream.createStream(data.data.id, selectedFile.id, 'torrent');
		const streamData = await torbox.stream.getStreamData(stream.data.presigned_token);

		return { data, stream, streamData };
	}
};
