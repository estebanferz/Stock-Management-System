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

const app = new Elysia({prefix: '/api'})
  .use(cors({ origin: Bun.env.PUBLIC_FRONTEND_URL })) // Enable CORS
  .get("/", () => {
    return { message: "app" };
  })
  .use(clientController)
  .use(technicianController)
  .use(phoneController)
  .use(repairController)
  .use(expenseController)
  .use(providerController)
  .use(saleController)
  .use(sellerController)

  .listen(3000);

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