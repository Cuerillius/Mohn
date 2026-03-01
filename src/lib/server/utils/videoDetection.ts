import type { TorrentFile } from '$lib/types/torbox/torrent';

const AUDIO_EXTENSIONS = [
	'.mp3',
	'.m4b',
	'.m4a',
	'.ogg',
	'.oga',
	'.wav',
	'.flac',
	'.aac',
	'.opus',
	'.weba'
];

const VIDEO_EXTENSIONS = [
	'.mp4',
	'.mkv',
	'.avi',
	'.mov',
	'.webm',
	'.flv',
	'.wmv',
	'.m4v',
	'.mpg',
	'.mpeg',
	'.3gp',
	'.ogv',
	'.ts',
	'.m2ts'
];

export function isVideoFile(file: TorrentFile) {
	const fileName = file.name?.toLowerCase() || file.short_name.toLowerCase() || '';

	if (AUDIO_EXTENSIONS.some((ext) => fileName.endsWith(ext))) {
		return false;
	}

	if (file.mimetype && file.mimetype.startsWith('video/')) {
		return true;
	}

	return VIDEO_EXTENSIONS.some((ext) => fileName.endsWith(ext));
}

export function autoSelectVideoFile(files: TorrentFile[], season?: number, episode?: number) {
	const videoFiles = files.filter(isVideoFile);

	if (videoFiles.length === 0) {
		return null;
	}

	if (videoFiles.length === 1) {
		return videoFiles[0];
	}

	if (season !== undefined && episode !== undefined) {
		const s = season.toString();
		const e = episode.toString();
		const sP = s.padStart(2, '0');
		const eP = e.padStart(2, '0');
		const seasonEpisodeRegex = new RegExp(
			[
				`s${sP}[:.\\s_-]?e${eP}`,
				`s${s}[:.\\s_-]?e${e}`,
				`${sP}x${eP}`,
				`${s}x${e}`,
				`season[:.\\s_-]?${s}[:.\\s_-]?ep(?:isode)?[:.\\s_-]?${e}`,
				`(?<!\\d)${s}${eP}(?!\\d)`,
				`(?<!\\d)${sP}${eP}(?!\\d)`
			].join('|'),
			'i'
		);
		const matchingFiles = videoFiles.filter((file) => seasonEpisodeRegex.test(file.name));
		if (matchingFiles.length > 0) {
			return matchingFiles.sort((a, b) => b.size - a.size)[0];
		}
	} else {
		return videoFiles.sort((a, b) => b.size - a.size)[0];
	}
}
