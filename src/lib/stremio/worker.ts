// Use the path where you placed the generated `pkg` folder
import initWasm, {
	initialize_runtime,
	get_state,
	dispatch,
	analytics,
	decode_stream
} from './../../../stremio/stremio_core_web';
import wasmUrl from './../../../stremio/stremio_core_web_bg.wasm?url';

import { Bridge } from './bridge';

const bridge = new Bridge(self, self);
const ctx = self as any;

ctx.init = async ({ appVersion, shellVersion }: any) => {
	ctx.app_version = appVersion;
	ctx.shell_version = shellVersion;

	ctx.get_location_hash = async () => bridge.call(['location', 'hash'], []);
	ctx.local_storage_get_item = async (key: string) =>
		bridge.call(['localStorage', 'getItem'], [key]);
	ctx.local_storage_set_item = async (key: string, value: string) =>
		bridge.call(['localStorage', 'setItem'], [key, value]);
	ctx.local_storage_remove_item = async (key: string) =>
		bridge.call(['localStorage', 'removeItem'], [key]);

	ctx.getState = get_state;
	ctx.dispatch = dispatch;
	ctx.analytics = analytics;
	ctx.decodeStream = decode_stream;

	await initWasm(wasmUrl);

	await initialize_runtime((event: any) => bridge.call(['onCoreEvent'], [event]));
};
