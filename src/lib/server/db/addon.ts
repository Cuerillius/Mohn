import type { AddonResultsResopnse } from '$lib/types/addon';
import { error } from '@sveltejs/kit';

export async function getStreams(
	manifest: string,
	type: string,
	id: string
): Promise<AddonResultsResopnse> {
	console.log(`Fetching streams from ${manifest} for ${type} with id ${id}`);
	console.log(
		`Request URL: ${manifest.replace('manifest.json', 'stream') + '/' + type + '/' + id + '.json'}`
	);
	const response = await fetch(
		manifest.replace('manifest.json', 'stream') + '/' + type + '/' + id + '.json'
	);

	if (!response.ok) {
		const errData = await response.json().catch(() => ({}));
		console.error(`Could not fetch stream data for ${manifest}`, errData);
		throw error(response.status, `Provider Error: ${errData.message || response.statusText}`);
	}

	return response.json();
}

export function getConfigUrl(manifest: string) {
	return manifest.replace('manifest.json', 'configure');
}
