export interface AddonResults {
	name: string;
	description: string;
	infoHash: string;
}

export type AddonResultsResopnse = { streams: AddonResults[] };
