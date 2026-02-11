import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";


const origin =
  import.meta.env.SSR
    ? process.env.SERVER_API_URL!.replace(/\/api$/, "")
    : window.location.origin;


export const clientApp = treaty<App>(origin, {
  fetch: { credentials: "include" },
}).api;