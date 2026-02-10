interface Catalog {
	id: string;
	name: string;
	type: string;
	addon: {
		manifest: {
			id: string;
			name: string;
		};
	};
	selected: boolean;
	deepLinks: {
		discover: string;
	};
}
