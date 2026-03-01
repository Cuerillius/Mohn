import { autoSelectVideoFile } from '$lib/server/utils/videoDetection';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	let results = null;
	if (event.locals.user && event.locals.torbox) {
		const query = event.url.searchParams.get('q');

		if (!query) {
			return { results: [] };
		}

		const torbox = event.locals.torbox;

		results = await torbox.search.findTorrentDataById(query, {
			metadata: true
		});
		console.log('Search results for query:', query, results);
	}
	return { results, isAutheticated: !!event.locals.user };
};

export const actions: Actions = {
	createTorrent: async (event) => {
		const formData = await event.request.formData();
		const magnet = formData.get('magnet')?.toString() ?? '';

		if (!event.locals.user || !event.locals.torbox) {
			return { success: false, error: 'User not authenticated' };
		}

		const torbox = event.locals.torbox;
		const res = await torbox.torrents.createTorrent(magnet);

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
