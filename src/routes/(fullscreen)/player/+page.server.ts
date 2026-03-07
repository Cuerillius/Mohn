import type { Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { autoSelectVideoFile } from '$lib/server/utils/videoDetection';

export const load: PageServerLoad = async (event) => {
	let result = null;
	if (event.locals.user && event.locals.torbox) {
		const type = event.url.searchParams.get('type');

		const presignedToken = event.url.searchParams.get('presigned_token');

		if (!type || !presignedToken) {
			return { result: null };
		}

		const torbox = event.locals.torbox;

		if (type === 'torrent') {
			result = await torbox.stream.getStreamData(presignedToken);
		}
	}
	return { result, isAutheticated: !!event.locals.user };
};

export const actions: Actions = {
	createStream: async (event) => {
		const formData = await event.request.formData();
		const torrentId = formData.get('torrentId')?.toString() ?? '';
		const subtileIndex: number = formData.get('subtitleIndex')
			? parseInt(formData.get('subtitleIndex')!.toString())
			: 0;
		const audioIndex: number = formData.get('audioIndex')
			? parseInt(formData.get('audioIndex')!.toString())
			: 0;
		const resolutionIndex: number = formData.get('resolutionIndex')
			? parseInt(formData.get('resolutionIndex')!.toString())
			: 0;

		if (!event.locals.torbox) return { status: 'error' };
		const torbox = event.locals.torbox;

		const data = await torbox.torrents.getTorrentData(torrentId);

		if (!data.data?.files || data.data.files.length === 0) {
			return { success: false, error: 'Files not ready' };
		}

		const selectedFile = autoSelectVideoFile(data.data.files) || data.data.files[0];
		const stream = await torbox.stream.createStream(
			data.data.id,
			selectedFile.id,
			'torrent',
			subtileIndex,
			audioIndex,
			resolutionIndex
		);
		const streamData = await torbox.stream.getStreamData(stream.data.presigned_token);

		return { data, stream, streamData };
	}
};
