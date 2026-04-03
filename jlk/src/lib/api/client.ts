import { hc } from "hono/client";
import type { AppType } from "@backend/index";
import { env } from "$env/dynamic/public";

export const api = hc<AppType>(env.PUBLIC_BACKEND_URL, {
  init: {
    credentials: "include",
  },
});
