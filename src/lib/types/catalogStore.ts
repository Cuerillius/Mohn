interface CatalogStore {
	selected: any | null;
	selectable: {
		types: {
			type: string;
			selected: boolean;
			deepLinks: {
				discover: string;
			};
		}[];
		catalogs: Catalog[];
		extra: any[];
		nextPage: boolean;
	};
	catalog: any | null;
}
