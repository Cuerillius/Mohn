export interface VideoPlayerState {
	manifest: PlayerManifest;
	stream: PlayerStream;

	// --- Playback State ---
	loaded: boolean;
	paused: boolean;
	time: number; // Current position in ms
	duration: number; // Total length in ms
	buffering: boolean;
	buffered: number; // Amount buffered in ms
	playbackSpeed: number;
	volume: number;
	muted: boolean;
	hasError: string | null;

	// --- Metadata ---
	videoParams: {
		hash: string | null;
		size: number | null;
		filename: string;
	};

	// --- Audio Tracks ---
	audioTracks: AudioTrack[];
	selectedAudioTrackId: string | null;

	// --- Subtitles (Internal/Embedded) ---
	subtitlesTracks: SubtitleTrack[];
	selectedSubtitlesTrackId: string | null;
	subtitlesOffset: number;
	subtitlesSize: number;
	subtitlesTextColor: string;
	subtitlesBackgroundColor: string;
	subtitlesOutlineColor: string;
	subtitlesOpacity: number;

	// --- Extra Subtitles (External/Addon) ---
	extraSubtitlesTracks: SubtitleTrack[];
	selectedExtraSubtitlesTrackId: string | null;
	extraSubtitlesDelay: number | null;
	extraSubtitlesSize: number;
	extraSubtitlesOffset: number;
	extraSubtitlesTextColor: string;
	extraSubtitlesBackgroundColor: string;
	extraSubtitlesOutlineColor: string;
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
