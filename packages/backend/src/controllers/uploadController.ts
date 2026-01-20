import { Elysia } from "elysia";
import path from "node:path";

const UPLOADS_DIR = path.join(import.meta.dir, "../../uploads");

export const uploadsController = new Elysia({ prefix: "/uploads" })
  .get("/logos/tenants/:tenantId/:filename", async (ctx) => {
    const { tenantId, filename } = ctx.params as any;

    if (String(filename).includes("..") || String(tenantId).includes("..")) {
      ctx.set.status = 400;
      return "Bad request";
    }

    const absPath = path.join(
      UPLOADS_DIR,
      "logos",
      "tenants",
      String(tenantId),
      String(filename)
    );

    const file = Bun.file(absPath);
    if (!(await file.exists())) {
      ctx.set.status = 404;
      return "Not found";
    }

    return new Response(file);
  });
