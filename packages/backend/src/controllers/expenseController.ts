import { Elysia, t } from "elysia";
import {
  getAllExpenses,
  getExpensesByFilter,
  addExpenseWithReceipt,
  updateExpenseWithReceipt,
  softDeleteExpense,
  getTotalExpenses,
  getExpenseReceiptFile,
  getTopExpensesByCategory,
} from "../services/expenseService";
import { expenseInsertDTO, expenseUpdateDTO, type Currency } from "@server/db/types";
import { safeFilename } from "../util/formattersBackend";
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

      const receipt = await getExpenseReceiptFile(ctx.tenantId, expenseId);

      if (!receipt) {
        ctx.set.status = 404;
        return;
      }

      const filename = safeFilename(receipt.originalName);

      ctx.set.headers["Content-Type"] = receipt.mime;
      ctx.set.headers["Content-Disposition"] = `inline; filename="${filename}"`;

      return receipt.file;
    })
  )

  .post(
    "/",
    protectedController(async (ctx) => {
      const { body, set } = ctx;

      try {
        const result = await addExpenseWithReceipt(
          ctx.tenantId,
          ctx.user.id,
          body
        );
        set.status = 201;
        return result;
      } catch (err: any) {
        switch (err.message) {
          case "INVALID_RECEIPT_TYPE":
            set.status = 400;
            return { error: "Tipo de archivo no permitido" };

          case "RECEIPT_TOO_LARGE":
            set.status = 400;
            return { error: "El archivo supera los 5MB" };

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
        ...expenseInsertDTO.properties,
        datetime: t.Optional(t.String({ format: "date-time" })),
        receipt: t.Optional(t.File()),
        provider_id: t.Optional(t.Union([t.Integer(), t.Null(), t.String()])),
      }),
      detail: {
        summary: "Insert a new expense (with optional receipt) (scoped by tenant)",
        tags: ["expenses"],
      },
    }
  )

  .put(
    "/:id",
    protectedController(async (ctx) => {
      const { body, set } = ctx;
      const expenseId = Number(ctx.params.id);

      try {
        const result = await updateExpenseWithReceipt(
          ctx.tenantId,
          ctx.user.id,
          expenseId,
          body
        );
        set.status = 200;
        return result;
      } catch (err: any) {
        switch (err.message) {
          case "INVALID_RECEIPT_TYPE":
            set.status = 400;
            return { error: "Tipo de archivo no permitido" };

          case "RECEIPT_TOO_LARGE":
            set.status = 400;
            return { error: "El archivo supera los 5MB" };

          case "EXPENSE_NOT_FOUND":
            set.status = 404;
            return { error: "Gasto no encontrado" };

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
        receipt: t.Optional(t.File()),
        provider_id: t.Optional(t.Union([t.Integer(), t.Null(), t.String()])),
      }),
      detail: {
        summary: "Update an expense (with optional receipt) (scoped by tenant)",
        tags: ["expenses"],
      },
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