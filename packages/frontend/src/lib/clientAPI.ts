import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

export const clientApp = treaty<App>(import.meta.env.PUBLIC_API_URL, {
  fetch: {
    credentials: "include",
  }
}).api;