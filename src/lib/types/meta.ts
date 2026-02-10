interface Meta {
	name: string;
	id: string;
	version: string;
	description: string;
	catalogs: {
		type: string;
		id: string;
		name: string;
		extra: {
			name: string;
			isRequired?: boolean;
			options?: string[];
		}[];
	}[];
	resources: {
		name: string;
		types: string[];
		idPrefixes?: string[];
	}[];
	types: string[];
	logo: string;
	behaviorHints: {
		configurable: boolean;
		configurationRequired: boolean;
	};
	addonCatalogs: any[];
	stremioAddonsConfig: {
		issuer: string;
		signature: string;
	};
}
