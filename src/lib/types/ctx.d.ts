interface Ctx {
	profile: {
		auth: Auth;
		addons: Addon[];
		addonsLocked: boolean;
		settings: Settings;
	};
	notifications: {
		uid: string;
		items: Record<string, NotificationItem[]>;
		lastUpdated: string;
		created: string;
	};
	searchHistory: SearchHistoryItem[];
	events: {
		modal: { type: string };
		notification: { type: string };
	};
	streamingServerUrls: StreamingServerUrl[];
}

interface Auth {
	key: string;
	user: {
		_id: string;
		email: string;
		fbId: string | null;
		appleId: string | null;
		avatar: string;
		lastModified: string;
		dateRegistered: string;
		trakt: {
			access_token: string;
			created_at: number;
			expires_in: number;
		} | null;
		premium_expire: string;
		gdpr_consent: {
			tos: boolean;
			privacy: boolean;
			marketing: boolean;
			from: string;
		};
		isNewUser: boolean;
	} | null;
}

interface Settings {
	interfaceLanguage: string;
	hideSpoilers: boolean;
	gamepadSupport: boolean;
	quitOnClose: boolean;
	pauseOnMinimize: boolean;
	sendCrashReports: boolean;
	serverInForeground: boolean;
	streamingServerUrl: string;
	streamingServerWarningDismissed: Date | null;
	remoteHttps: string | null;
	playerType: string | null;
	bingeWatching: boolean;
	playInBackground: boolean;
	hardwareDecoding: boolean;
	videoMode: string | null;
	autoFrameRateMatching: boolean;
	frameRateMatchingStrategy: string;
	nextVideoNotificationDuration: number;
	seekTimeDuration: number;
	seekShortTimeDuration: number;
	escExitFullscreen: boolean;
	audioLanguage: string;
	secondaryAudioLanguage: string | null;
	audioPassthrough: boolean;
	surroundSound: boolean;
	subtitlesLanguage: string | null;
	secondarySubtitlesLanguage: string | null;
	subtitlesSize: number;
	subtitlesFont: string;
	subtitlesBold: boolean;
	subtitlesOffset: number;
	subtitlesTextColor: string;
	subtitlesBackgroundColor: string;
	subtitlesOutlineColor: string;
	subtitlesOpacity: number;
	assSubtitlesStyling: boolean;
}

interface NotificationItem {
	metaId: string;
	videoId: string;
	videoReleased: string;
}

interface SearchHistoryItem {
	query: string;
	deepLinks: {
		search: string;
	};
}

interface StreamingServerUrl {
	url: string;
	mtime: Date;
}
