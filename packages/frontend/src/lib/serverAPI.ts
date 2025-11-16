import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

export const serverApp = treaty<App>(import.meta.env.SERVER_API_URL).api;