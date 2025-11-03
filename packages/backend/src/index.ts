import { Elysia } from "elysia";
import {clientController} from "./controllers/clientController";


const app = new Elysia({prefix: '/api'})
  .get("/", () => {
    return { message: "app" };
  })
  .use(clientController)

  .listen(3000);

console.log(
  `🦊 Elysia is running in http://${app.server?.hostname}:${app.server?.port}`
);