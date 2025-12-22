import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

const baseURL = import.meta.env.SSR
  ? (process.env.SERVER_API_URL ?? import.meta.env.PUBLIC_API_URL) // server-side
  : "/api"; // browser-side (same-origin)

export const clientApp = treaty<App>(baseURL, {
  fetch: { credentials: "include" },
}).api;