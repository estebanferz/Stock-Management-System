import { treaty } from "@elysiajs/eden";
import type { App } from "@server/src/index";

const getBrowserOrigin = () => {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
};

const origin = import.meta.env.SSR
  ? (process.env.SERVER_API_URL ?? "")
  : getBrowserOrigin();

export const serverApp = treaty<App>(origin).api;
