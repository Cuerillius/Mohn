interface Catalog {
	id: string;
	name: string;
	type: string;
	addon: { manifest: { id: string; name: string } };
	selected: boolean;
	content: Loadable<DiscoverItem[]>;
	deepLinks: {
		discover: string;
	};
}
