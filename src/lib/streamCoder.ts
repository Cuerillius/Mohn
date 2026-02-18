import pako from 'pako';

export function encodeStream(streamObj: any): string {
	const str = JSON.stringify(streamObj);
	const compressed = pako.deflate(str);
	const base64 = btoa(String.fromCharCode(...compressed));
	return encodeURIComponent(base64);
}

export function decodeStream(encodedStr: string): any {
	try {
		const base64 = decodeURIComponent(encodedStr);
		const binary = atob(base64);
		const charCodes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			charCodes[i] = binary.charCodeAt(i);
		}
		const decompressed = pako.inflate(charCodes, { to: 'string' });
		return JSON.parse(decompressed);
	} catch (e) {
		console.error('Failed to decode stream', e);
		return null;
	}
}
