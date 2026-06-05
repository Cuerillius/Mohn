/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEKEEPER_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
