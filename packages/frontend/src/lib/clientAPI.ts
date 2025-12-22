import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

const baseURL = import.meta.env.SSR
  ? process.env.SERVER_API_URL // SSR → backend real
  : ""; // browser → same-origin

export const clientApp = treaty<App>(baseURL, {
  fetch: {
    credentials: "include",
  },
}).api;
