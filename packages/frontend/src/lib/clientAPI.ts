import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

function stripApi(u: string) {
  return u.replace(/\/api\/?$/, "");
}

const origin = import.meta.env.SSR
  ? stripApi(process.env.SERVER_API_URL ?? process.env.PUBLIC_API_URL ?? "")
  : stripApi(import.meta.env.PUBLIC_API_URL ?? window.location.origin);

if (!origin) {
  throw new Error("Missing API origin. Set PUBLIC_API_URL (and SERVER_API_URL for SSR) in Railway.");
}

export const clientApp = treaty<App>(origin, {
  fetch: { credentials: "include" },
}).api;
