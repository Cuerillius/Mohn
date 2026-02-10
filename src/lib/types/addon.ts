interface Addon {
	manifest: {
		id: string;
		version: string;
		name: string;
		description: string;
		contactEmail: string | null;
		logo?: string | null;
		background?: string | null;
		types: string[];
		resources: (string | { name: string; types: string[]; idPrefixes?: string[] })[];
		idPrefixes?: string[] | null;
		catalogs: {
			id: string;
			type: string;
			name: string | null;
			extra?: {
				name: string;
				isRequired: boolean;
				options?: string[];
				optionsLimit?: number;
			}[];
			extraRequired?: string[];
			extraSupported?: string[];
		}[];
		addonCatalogs: any[];
		behaviorHints: {
			adult: boolean;
			p2p: boolean;
			configurable: boolean;
			configurationRequired: boolean;
		};
	};
	transportUrl: string;
	flags: {
		official: boolean;
		protected: boolean;
	};
}
