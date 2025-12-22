import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import {clientController} from "./controllers/clientController";
import {technicianController} from "./controllers/technicianController";
import {phoneController} from "./controllers/phoneController";
import {repairController} from "./controllers/repairController";
import {expenseController} from "./controllers/expenseController";
import {providerController} from "./controllers/providerController";
import {saleController} from "./controllers/saleController";
import {sellerController} from "./controllers/sellerController";

const port = Number(process.env.PORT ?? 3000);

const app = new Elysia({prefix: '/api'})
  .use(cors({ origin: [
    Bun.env.PUBLIC_FRONTEND_URL,
    /\.ngrok-free\.app$/,                         //Accept Ngrok conections for client Demo
  ].filter(Boolean) as (string | RegExp)[] }))
  .get("/", () => {
    return { message: "app" };
  })
  .get("/health", () => ({ status: "ok" }))
  .use(clientController)
  .use(technicianController)
  .use(phoneController)
  .use(repairController)
  .use(expenseController)
  .use(providerController)
  .use(saleController)
  .use(sellerController)

  .listen({
    hostname: "0.0.0.0",
    port,
  });

console.log(
  `🦊 Elysia is running in http://${app.server?.hostname}:${app.server?.port}`
);

const devPreset = new Elysia()
  .onError(({ error, code }) => {
    if (code === "NOT_FOUND") return { error: code };

    console.error(error);
  })
  .use(swagger({ path: "/swagger" }))
  .use(app);

export const api = devPreset;
export type App = typeof devPreset;