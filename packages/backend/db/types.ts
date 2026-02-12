import { clientTable, technicianTable, phoneTable, providerTable, expenseTable, repairTable, sellerTable, saleTable, accessoryTable } from './schema';
import { createInsertSchema } from 'drizzle-typebox';
import { t } from 'elysia';

export const clientInsertSchema = createInsertSchema(clientTable);
export const clientInsertDTO = t.Omit(clientInsertSchema, ["client_id", "tenant_id"]);
export const clientUpdateDTO = t.Omit(clientInsertSchema, ["client_id", "tenant_id"]);

export const technicianSchema = createInsertSchema(technicianTable);
export const technicianInsertDTO = t.Omit(technicianSchema, ["technician_id", "tenant_id"]);
export const technicianUpdateDTO = t.Omit(technicianSchema, ["technician_id", "tenant_id"]);

export const phoneSchema = createInsertSchema(phoneTable);
export const phoneInsertDTO = t.Omit(phoneSchema, ["device_id", "tenant_id"]);
export const phoneUpdateDTO = t.Omit(phoneSchema, ["device_id", "tenant_id"]);

export const providerSchema = createInsertSchema(providerTable);
export const providerInsertDTO = t.Omit(providerSchema, ["provider_id", "tenant_id"]);
export const providerUpdateDTO = t.Omit(providerSchema, ["provider_id", "tenant_id"]);   

export const expenseSchema = createInsertSchema(expenseTable);
export const expenseInsertDTO = t.Omit(expenseSchema, ["expense_id", "tenant_id", "created_by_user_id"]);
export const expenseUpdateDTO = t.Omit(expenseSchema, ["expense_id", "tenant_id", "created_by_user_id"]);

export const repairSchema = createInsertSchema(repairTable);
export const repairInsertDTO = t.Omit(repairSchema, ["repair_id", "tenant_id"]);
export const repairUpdateDTO = t.Omit(repairSchema, ["repair_id", "tenant_id"]);

export const sellerSchema = createInsertSchema(sellerTable);
export const sellerInsertDTO = t.Omit(sellerSchema, ["seller_id", "tenant_id"]);
export const sellerUpdateDTO = t.Omit(sellerSchema, ["seller_id", "tenant_id"]);

export const giftAccessoryDTO = t.Object({
  accessory_id: t.Number(),
  qty: t.Number({ minimum: 1 }),
});

export const tradeInPhoneDTO = t.Object({
  datetime: t.Optional(t.String({ format: "date-time" })),
  name: t.String(),
  brand: t.String(),
  imei: t.String(),
  device_type: t.String(),
  battery_health: t.Optional(t.Number()),
  storage_capacity: t.Optional(t.Number()),
  color: t.Optional(t.String()),
  category: t.String(),
  price: t.String(),
  buy_cost: t.String(),
  currency_buy: t.Optional(t.String()),
  currency_sale: t.Optional(t.String()),
  deposit: t.String(),
});
export const saleSchema = createInsertSchema(saleTable);

export const saleInsertDTO = t.Object({
  ...t.Omit(saleSchema, ["sale_id", "tenant_id"]).properties,
  datetime: t.Optional(t.String({ format: "date-time" })),
  gift_accessories: t.Optional(t.Array(giftAccessoryDTO)),
  trade_in_phone: t.Optional(tradeInPhoneDTO),
});

export const saleUpdateDTO = t.Object({
  ...t.Omit(saleSchema, ["sale_id", "tenant_id"]).properties,
  datetime: t.Optional(t.String({ format: "date-time" })),
  gift_accessories: t.Optional(t.Array(giftAccessoryDTO)),
  trade_in_phone: t.Optional(tradeInPhoneDTO),
});

export const accessorySchema = createInsertSchema(accessoryTable);
export const accessoryInsertDTO = t.Omit(accessorySchema, ["accessory_id", "tenant_id"]);
export const accessoryUpdateDTO = t.Omit(accessorySchema, ["accessory_id", "tenant_id"]);

export type TenantRole = "owner" | "admin" | "staff";
export type Currency = "ARS" | "USD" | "EUR" | "BRL";

export type AuthUser = {
  id: number;
  email: string;
  role?: string | null;
  is_active: boolean;
  created_at: Date | string | null;
  last_login: Date | string | null;
};
export type AuthTenant = {
  id: number;
  name: string | null;
  is_active: boolean;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

export type TenantSettings = {
  business_name?: string | null;
  logo_key?: string | null;
  logo_mime?: string | null;
  logo_updated_at?: string | Date | null;
  display_currency?: string | null;
  cuit?: string | null;
  address?: string | null;
  timezone?: string | null;
  low_stock_threshold_default?: number | null;
  updated_at?: string | Date | null;

  // billing
  trial_ends_at?: Date | null;
  subscription_status?: string | null;
};

export type UserSettings = {
  display_name: string | null;
  phone: string | null;
  email_notifications: boolean;
  updated_at: Date | string | null;
};

export type AuthMe = {
  user: AuthUser;
  tenant: AuthTenant;
  roleInTenant: TenantRole;
  tenantSettings?: TenantSettings | null;
  userSettings?: UserSettings | null;
};

export const SESSION_COOKIE = "session"
export const SESSION_DAYS = 7;
export const ROUNDS = 12;