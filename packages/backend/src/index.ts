import { Elysia } from "elysia";
import {clientController} from "./controllers/clientController";
import {technicianController} from "./controllers/technicianController";
import {phoneController} from "./controllers/phoneController";
import {repairController} from "./controllers/repairController";
import {expenseController} from "./controllers/expenseController";
import {providerController} from "./controllers/providerController";

const app = new Elysia({prefix: '/api'})
  .get("/", () => {
    return { message: "app" };
  })
  .use(clientController)
  .use(technicianController)
  .use(phoneController)
  .use(repairController)
  .use(expenseController)
  .use(providerController)

  .listen(3000);

console.log(
  `🦊 Elysia is running in http://${app.server?.hostname}:${app.server?.port}`
);