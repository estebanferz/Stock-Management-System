import { clientTable, technicianTable, phoneTable, providerTable, expenseTable, repairTable, sellerTable, saleTable } from './schema';
import { createInsertSchema } from 'drizzle-typebox';
import { t } from 'elysia';

export const clientInsertSchema = createInsertSchema(clientTable);
export const clientInsertDTO = t.Omit(clientInsertSchema, ["client_id", "user_id"]);
export const clientUpdateDTO = t.Omit(clientInsertSchema, ["client_id", "user_id"]);

export const technicianSchema = createInsertSchema(technicianTable);
export const technicianInsertDTO = t.Omit(technicianSchema, ["technician_id", "user_id"]);
export const technicianUpdateDTO = t.Omit(technicianSchema, ["technician_id", "user_id"]);

export const phoneSchema = createInsertSchema(phoneTable);
export const phoneInsertDTO = t.Omit(phoneSchema, ["device_id", "user_id"]);
export const phoneUpdateDTO = t.Omit(phoneSchema, ["device_id", "user_id"]);

export const providerSchema = createInsertSchema(providerTable);
export const providerInsertDTO = t.Omit(providerSchema, ["provider_id", "user_id"]);
export const providerUpdateDTO = t.Omit(providerSchema, ["provider_id", "user_id"]);   

export const expenseSchema = createInsertSchema(expenseTable);
export const expenseInsertDTO = t.Omit(expenseSchema, ["expense_id", "user_id"]);
export const expenseUpdateDTO = t.Omit(expenseSchema, ["expense_id", "user_id"]);

export const repairSchema = createInsertSchema(repairTable);
export const repairInsertDTO = t.Omit(repairSchema, ["repair_id", "user_id"]);
export const repairUpdateDTO = t.Omit(repairSchema, ["repair_id", "user_id"]);

export const sellerSchema = createInsertSchema(sellerTable);
export const sellerInsertDTO = t.Omit(sellerSchema, ["seller_id", "user_id"]);
export const sellerUpdateDTO = t.Omit(sellerSchema, ["seller_id", "user_id"]);

export const saleSchema = createInsertSchema(saleTable);
export const saleInsertDTO = t.Omit(saleSchema, ["sale_id", "user_id"]);
export const saleUpdateDTO = t.Omit(saleSchema, ["sale_id", "user_id"]);

export type AuthUser = {
  id: number;
  email: string;
  role?: string | null;
};

export const SESSION_COOKIE = "session"
export const SESSION_DAYS = 7;
export const ROUNDS = 12;