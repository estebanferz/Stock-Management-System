import { Elysia, t } from "elysia";
import {
  getSellersByFilter,
  getAllSellers,
  getSellerById,
  addSeller,
  updateSeller,
  softDeleteSeller,
} from "../services/sellerService";
import { sellerInsertDTO, sellerUpdateDTO } from "@server/db/types";
import { protectedController } from "../util/protectedController";

export const sellerController = new Elysia({ prefix: "/seller" })
  .get("/", () => ({ message: "Seller endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const query = ctx.query;

      if (
        query.name ||
        query.hire_date ||
        query.pay_date ||
        query.age_min ||
        query.age_max ||
        query.commission_min ||
        query.commission_max ||
        query.is_deleted
      ) {
        return await getSellersByFilter(tenantId, {
          name: query.name,
          hire_date: query.hire_date,
          pay_date: query.pay_date,
          age_min: query.age_min,
          age_max: query.age_max,
          commission_min: query.commission_min,
          commission_max: query.commission_max,
          is_deleted:
            query.is_deleted === undefined ? undefined : query.is_deleted === "true",
        });
      }

      return await getAllSellers(tenantId);
    }),
    {
      detail: {
        summary: "Get all sellers in DB (scoped by tenant)",
        tags: ["sellers"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const body = ctx.body;

      const newSeller = {
        tenant_id: tenantId,
        name: body.name,
        age: body.age,
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone_number !== undefined && { phone_number: body.phone_number }),
        ...(body.hire_date !== undefined && { hire_date: body.hire_date }),
        ...(body.pay_date !== undefined && { pay_date: body.pay_date }),
        ...(body.commission !== undefined && { commission: body.commission }),
      };

      const result = await addSeller(tenantId, newSeller);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...sellerInsertDTO.properties,
      }),
      detail: {
        summary: "Insert a new seller (scoped by tenant)",
        tags: ["sellers"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const sellerId = Number(ctx.params.id);

      return await getSellerById(tenantId, sellerId);
    }),
    {
      detail: {
        summary: "Get seller details by ID (scoped by tenant)",
        tags: ["sellers"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const sellerId = Number(ctx.params.id);
      const body = ctx.body;

      const updSeller = {
        name: body.name,
        age: body.age,
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone_number !== undefined && { phone_number: body.phone_number }),
        ...(body.pay_date !== undefined && { pay_date: body.pay_date }),
        ...(body.hire_date !== undefined && { hire_date: body.hire_date }),
        ...(body.commission !== undefined && { commission: body.commission }),
      };

      const result = await updateSeller(tenantId, sellerId, updSeller);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...sellerUpdateDTO.properties,
      }),
      detail: {
        summary: "Update a seller (scoped by tenant)",
        tags: ["sellers"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const tenantId = ctx.tenantId;
      const sellerId = Number(ctx.params.id);

      const ok = await softDeleteSeller(tenantId, sellerId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
