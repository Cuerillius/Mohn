/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEKEEPER_URL: string;
  readonly VITE_LANDING_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const __APP_VERSION__: string;
