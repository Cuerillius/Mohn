const workerScope = self as unknown as Record<string, any>;

let coreModulePromise: Promise<any> | null = null;

const pendingCalls = new Map<
  string,
  { resolve: (value: unknown) => void; reject: (error: unknown) => void }
>();

async function loadCoreModule() {
  if (!coreModulePromise) {
    coreModulePromise = import("../../../stremio/stremio_core_web.js");
  }
  return coreModulePromise;
}

function callMain(path: string[], args: unknown[]) {
  const id = Math.random().toString(32).slice(2);
  const promise = new Promise((resolve, reject) => {
    pendingCalls.set(id, { resolve, reject });
  });
  workerScope.postMessage({ request: { id, path, args } });
  return promise;
}

workerScope.addEventListener("message", (event: MessageEvent) => {
  const data = event.data;
  if (data?.response) {
    const pending = pendingCalls.get(data.response.id);
    if (!pending) return;
    pendingCalls.delete(data.response.id);
    if ("error" in data.response.result) {
      pending.reject(data.response.result.error);
    } else {
      pending.resolve(data.response.result.data);
    }
    return;
  }

  if (data?.request) {
    const { id, path, args } = data.request;
    try {
      const value = path.reduce(
        (acc: any, key: string) => acc?.[key],
        workerScope,
      );
      if (typeof value === "function") {
        const thisArg = path
          .slice(0, path.length - 1)
          .reduce((acc: any, key: string) => acc?.[key], workerScope);
        Promise.resolve(value.apply(thisArg, args)).then(
          (result) => {
            workerScope.postMessage({
              response: { id, result: { data: result } },
            });
          },
          (error) => {
            workerScope.postMessage({ response: { id, result: { error } } });
          },
        );
      } else {
        workerScope.postMessage({ response: { id, result: { data: value } } });
      }
    } catch (error) {
      workerScope.postMessage({ response: { id, result: { error } } });
    }
  }
});

workerScope.init = async ({
  appVersion,
  shellVersion,
}: {
  appVersion: string;
  shellVersion: string;
}) => {
  // wasm-bindgen expects document.baseURI for URL resolution
  workerScope.document = {
    baseURI: self.location.href,
  };

  workerScope.app_version = appVersion;
  workerScope.shell_version = shellVersion;
  workerScope.get_location_hash = async () =>
    callMain(["location", "hash"], []);
  workerScope.local_storage_get_item = async (key: string) =>
    callMain(["localStorage", "getItem"], [key]);
  workerScope.local_storage_set_item = async (key: string, value: string) =>
    callMain(["localStorage", "setItem"], [key, value]);
  workerScope.local_storage_remove_item = async (key: string) =>
    callMain(["localStorage", "removeItem"], [key]);

  const core = await loadCoreModule();
  const coreModule = core.default ?? core;
  const initialize_api =
    typeof coreModule === "function" ? coreModule : coreModule.default;
  const initialize_runtime =
    core.initialize_runtime ?? coreModule.initialize_runtime;

  workerScope.getState = core.get_state ?? coreModule.get_state;
  workerScope.getDebugState =
    core.get_debug_state ?? coreModule.get_debug_state;
  workerScope.dispatch = core.dispatch ?? coreModule.dispatch;
  workerScope.analytics = core.analytics ?? coreModule.analytics;
  workerScope.decodeStream = core.decode_stream ?? coreModule.decode_stream;

  await initialize_api(
    new URL("../../../stremio/stremio_core_web_bg.wasm", import.meta.url),
  );
  await initialize_runtime((event: unknown) =>
    callMain(["onCoreEvent"], [event]),
  );
  return "ready";
};
