interface Ctx {
	profile: {
		auth: {
			key: string;
			user: {
				_id: string;
				email: string;
				fbId: string | null;
				appleId: string | null;
				avatar: string;
				lastModified: string;
				dateRegistered: string;
				trakt: any | null;
				premium_expire: string;
				gdpr_consent: {
					tos: boolean;
					privacy: boolean;
					marketing: boolean;
					from: string;
				};
				isNewUser: boolean;
			} | null;
		};
		addons: Array<Addon>;
		addonsLocked: boolean;
		settings: {
			interfaceLanguage: string;
			hideSpoilers: boolean;
			gamepadSupport: boolean;
			streamingServerUrl: string;
			playerType: string | null;
			bingeWatching: boolean;
			playInBackground: boolean;
			hardwareDecoding: boolean;
			videoMode: string | null;
			frameRateMatchingStrategy: string;
			nextVideoNotificationDuration: number;
			audioPassthrough: boolean;
			audioLanguage: string;
			secondaryAudioLanguage: string | null;
			subtitlesLanguage: string;
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
			escExitFullscreen: boolean;
			seekTimeDuration: number;
			seekShortTimeDuration: number;
			pauseOnMinimize: boolean;
			quitOnClose: boolean;
			surroundSound: boolean;
			streamingServerWarningDismissed: string | null;
			serverInForeground: boolean;
			sendCrashReports: boolean;
		};
	};
	notifications: {
		items: Record<string, any>;
		lastUpdated: string;
		created: string;
	};
	searchHistory: any[];
	events: {
		modal: { type: string };
		notification: { type: string };
	};
	streamingServerUrls: {
		url: string;
		mtime: string;
	}[];
}
