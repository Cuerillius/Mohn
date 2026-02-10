import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { viteCommonjs } from "@originjs/vite-plugin-commonjs";
import { fileURLToPath, URL } from "node:url";

const stremioRoot = fileURLToPath(new URL("../stremio", import.meta.url));
const stremioIdMarker = "/stremio/";

export default defineConfig({ plugins: [tailwindcss(), sveltekit(), viteCommonjs({ include: [stremioIdMarker] })],
  assetsInclude: ["**/*.wasm"],
  server: {
    fs: {
      allow: [fileURLToPath(new URL(".", import.meta.url)), stremioRoot],
    },
  },
  build: {
    commonjsOptions: {
      include: [/stremio/],
    },
  }});
