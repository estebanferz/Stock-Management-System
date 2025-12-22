import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

// En browser: same-origin (NO /api porque ya lo pone `.api`)
const baseURL = import.meta.env.SSR
  ? (process.env.SERVER_API_ORIGIN ?? import.meta.env.PUBLIC_API_ORIGIN)
  : "";

export const clientApp = treaty<App>(baseURL, {
  fetch: { credentials: "include" },
}).api;
