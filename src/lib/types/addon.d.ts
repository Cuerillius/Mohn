interface Addon {
	manifest: Manifest;
	transportUrl: string;
	flags: {
		official: boolean;
		protected: boolean;
	};
}
