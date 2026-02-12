import { Elysia, t } from "elysia";
import {
  getAllExpenses,
  getExpensesByFilter,
  softDeleteExpense,
  getTotalExpenses,
  getTopExpensesByCategory,
  linkExpenseReceipt,
  presignExpenseReceiptUpload,
  addExpense,
  getExpenseReceiptSignedUrl,
  updateExpense,
} from "../services/expenseService";
import { expenseInsertDTO, expenseUpdateDTO, type Currency } from "@server/db/types";
import { protectedController } from "../util/protectedController";
import { getFxSnapshotVenta } from "../services/currencyService";

export const expenseController = new Elysia({ prefix: "/expense" })
  .get("/", () => ({ message: "Expense endpoint" }))

  .get(
    "/all",
    protectedController(async (ctx) => {
      const { query, tenantId } = ctx;

      if (
        query.date ||
        query.category ||
        query.payment_method ||
        query.provider_id ||
        query.amount_min ||
        query.amount_max ||
        query.is_deleted
      ) {
        return await getExpensesByFilter(tenantId, {
          date: query.date,
          category: query.category,
          payment_method: query.payment_method,
          provider_id: query.provider_id,
          amount_min: query.amount_min,
          amount_max: query.amount_max,
          is_deleted:
            query.is_deleted === undefined
              ? undefined
              : query.is_deleted === "true",
        });
      }

      return await getAllExpenses(tenantId);
    }),
    {
      detail: {
        summary: "Get all expenses in DB (scoped by tenant)",
        tags: ["expenses"],
      },
    }
  )
  .get(
    "/:id/receipt",
    protectedController(async (ctx) => {
      const expenseId = Number(ctx.params.id);

      const url = await getExpenseReceiptSignedUrl(ctx.tenantId, expenseId);

      if (!url) {
        ctx.set.status = 404;
        return;
      }
      ctx.set.status = 302;
      ctx.set.headers["Location"] = url;
      return;
    })
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const { body, set } = ctx;
      const result = await addExpense(ctx.tenantId, ctx.user.id, {
        ...body,
        datetime: body.datetime ? new Date(body.datetime) : undefined,
      });
      set.status = 201;
      return result;
    }),
    {
      body: t.Object({
        ...expenseInsertDTO.properties,
        datetime: t.Optional(t.String({ format: "date-time" })),
        provider_id: t.Optional(t.Union([t.Integer(), t.Null(), t.String()])),
      }),
    }
  )
  .put(
    "/:id",
    protectedController(async (ctx) => {
      const { body, set } = ctx;
      const expenseId = Number(ctx.params.id);

      try {
        const result = await updateExpense(
          ctx.tenantId,
          expenseId,
          {
            datetime: body.datetime ? new Date(body.datetime) : undefined,
            category: body.category,
            description: body.description,
            amount: body.amount,
            currency: body.currency,
            payment_method: body.payment_method,
            provider_id: body.provider_id,
          }
        );

        if (!result.length) {
          set.status = 404;
          return { error: "Gasto no encontrado" };
        }

        set.status = 200;
        return result[0];
      } catch (err: any) {
        switch (err.message) {
          case "PROVIDER_NOT_FOUND":
            set.status = 400;
            return { error: "Proveedor inválido" };

          default:
            throw err;
        }
      }
    }),
    {
      body: t.Object({
        ...expenseUpdateDTO.properties,
        datetime: t.Optional(t.String({ format: "date-time" })),
        provider_id: t.Optional(t.Union([t.Integer(), t.Null(), t.String()])),
      }),
      detail: {
        summary: "Update an expense (without receipt, bucket-based storage)",
        tags: ["expenses"],
      },
    }
  )
  .post(
    "/:id/receipt/presign",
    protectedController(async (ctx) => {
      const expenseId = Number(ctx.params.id);
      const { contentType, filename, size } = ctx.body;

      const result = await presignExpenseReceiptUpload(ctx.tenantId, expenseId, {
        contentType,
        filename,
        size,
      });

      if (!result.ok) {
        ctx.set.status = result.status;
        return { ok: false, message: result.message };
      }

      return { ok: true, key: result.key, putUrl: result.putUrl };
    }),
    {
      body: t.Object({
        contentType: t.String({ minLength: 1, maxLength: 100 }),
        filename: t.String({ minLength: 1, maxLength: 255 }),
        size: t.Integer({ minimum: 1 }),
      }),
    }
  )
  .post(
    "/:id/receipt/link",
    protectedController(async (ctx) => {
      const expenseId = Number(ctx.params.id);
      const { key, contentType, filename, size } = ctx.body;

      const result = await linkExpenseReceipt(ctx.tenantId, expenseId, {
        key,
        contentType,
        filename,
        size,
      });

      if (!result.ok) {
        ctx.set.status = result.status;
        return { ok: false, message: result.message };
      }

      return { ok: true };
    }),
    {
      body: t.Object({
        key: t.String({ minLength: 1, maxLength: 1024 }),
        contentType: t.String({ minLength: 1, maxLength: 100 }),
        filename: t.String({ minLength: 1, maxLength: 255 }),
        size: t.Integer({ minimum: 1 }),
      }),
    }
  )

  .delete(
    "/:id",
    protectedController(async (ctx) => {
      const expenseId = Number(ctx.params.id);

      const ok = await softDeleteExpense(ctx.tenantId, expenseId);
      ctx.set.status = ok ? 200 : 404;
      return ok;
    })
  )

  .get(
    "/expenses",
    protectedController(async (ctx) => {
      return await getTotalExpenses(ctx.tenantId);
    }),
    {
      detail: {
        summary: "Get expenses (scoped by tenant)",
        tags: ["sales"],
      },
    }
  )
  .get("/top-by-category", protectedController(async (ctx) => {
    const display: Currency = ctx.tenantSettings.display_currency ?? "ARS";
    const fx = await getFxSnapshotVenta();
    return await getTopExpensesByCategory(ctx.tenantId, display, fx, 5);
  }));