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
      const userId = ctx.user.id;
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
        return await getSellersByFilter(userId, {
          name: query.name,
          hire_date: query.hire_date,
          pay_date: query.pay_date,
          age_min: query.age_min,
          age_max: query.age_max,
          commission_min: query.commission_min,
          commission_max: query.commission_max,
          is_deleted:
            query.is_deleted === undefined
              ? undefined
              : query.is_deleted === "true",
        });
      }

      return await getAllSellers(userId);
    }),
    {
      detail: {
        summary: "Get all sellers in DB (scoped by user)",
        tags: ["sellers"],
      },
    }
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const body = ctx.body;

      const newSeller = {
        user_id: userId,
        name: body.name,
        age: body.age,
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.hire_date && { hire_date: body.hire_date }),
        ...(body.pay_date && { pay_date: body.pay_date }),
        ...(body.commission && { commission: body.commission }),
      };

      const result = await addSeller(userId, newSeller);
      ctx.set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...sellerInsertDTO.properties,
      }),
      detail: {
        summary: "Insert a new seller (scoped by user)",
        tags: ["sellers"],
      },
    }
  )

  .get(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const sellerId = Number(ctx.params.id);

      return await getSellerById(userId, sellerId);
    }),
    {
      detail: {
        summary: "Get seller details by ID (scoped by user)",
        tags: ["sellers"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const sellerId = Number(ctx.params.id);
      const body = ctx.body;

      const updSeller = {
        name: body.name,
        age: body.age,
        ...(body.email && { email: body.email }),
        ...(body.phone_number && { phone_number: body.phone_number }),
        ...(body.pay_date && { pay_date: body.pay_date }),
        ...(body.hire_date && { hire_date: body.hire_date }),
        ...(body.commission && { commission: body.commission }),
      };

      const result = await updateSeller(userId, sellerId, updSeller);
      ctx.set.status = 200;
      return result;
    }),
    {
      body: t.Object({
        ...sellerUpdateDTO.properties,
      }),
      detail: {
        summary: "Update a seller (scoped by user)",
        tags: ["sellers"],
      },
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const userId = ctx.user.id;
      const sellerId = Number(ctx.params.id);

      const ok = await softDeleteSeller(userId, sellerId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  );
