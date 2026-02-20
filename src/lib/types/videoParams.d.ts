export interface VideoPlayerState {
	manifest: PlayerManifest | null;
	stream: PlayerStream | null;
	loaded: boolean;
	paused: boolean;
	time: number;
	duration: number;
	buffering: boolean;
	buffered: number;
	playbackSpeed: number;
	volume: number;
	muted: boolean;
	hasError: string | null;
	videoParams: {
		hash: string | null;
		size: number | null;
		filename: string;
	} | null;
	audioTracks: AudioTrack[];
	selectedAudioTrackId: string | null;
	subtitlesTracks: SubtitleTrack[] | [];
	selectedSubtitlesTrackId: string | null;
	subtitlesOffset: number;
	subtitlesSize: number;
	subtitlesTextColor: string | null;
	subtitlesBackgroundColor: string | null;
	subtitlesOutlineColor: string | null;
	subtitlesOpacity: number;
	extraSubtitlesTracks: SubtitleTrack[] | [];
	selectedExtraSubtitlesTrackId: string | null;
	extraSubtitlesDelay: number | null;
	extraSubtitlesSize: number;
	extraSubtitlesOffset: number;
	extraSubtitlesTextColor: string | null;
	extraSubtitlesBackgroundColor: string | null;
	extraSubtitlesOutlineColor: string | null;
	extraSubtitlesOpacity: number;
}

export interface PlayerManifest {
	name: string;
	external: boolean;
	props: string[];
	commands: string[];
	events: string[];
}

export interface PlayerStream {
	url: string;
	name: string;
	description: string;
	behaviorHints: {
		bingeGroup?: string;
		filename?: string;
		videoSize?: number;
	};
	progress: number | null;
	deepLinks: {
		player: string;
		externalPlayer: {
			download: string | null;
			streaming: string | null;
			playlist: string | null;
			fileName: string | null;
			openPlayer: string | null;
			web: string | null;
			androidTv: string | null;
			tizen: string | null;
			webos: string | null;
		};
	};
	lastUsed: boolean;
}

export interface AudioTrack {
	id: string;
	lang: string;
	label: string;
	origin: 'EMBEDDED' | 'EXTERNAL' | string;
	embedded: boolean;
}

export interface SubtitleTrack {
	id: string;
	lang: string;
	label: string;
	origin: 'EMBEDDED' | 'EXTERNAL' | string;
	url?: string;
}
