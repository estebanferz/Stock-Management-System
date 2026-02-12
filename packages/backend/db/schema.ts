import { index, integer, pgTable, varchar, date, bigint, numeric, timestamp, boolean, text, pgEnum, serial, uniqueIndex, unique, jsonb } from "drizzle-orm/pg-core";
import { type InferSelectModel, sql } from "drizzle-orm"

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const tenantRoleEnum = pgEnum("tenant_role", ["owner", "admin", "staff"]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "inactive",
  "pending",
  "active",
  "trial",  
  "past_due",
  "canceled",
]);

export const signupIntentStatusEnum = pgEnum("signup_intent_status", [
  "created",     // se generó link de pago
  "pending",     // usuario entró a MP / en proceso
  "approved",    // pago/autorización OK (listo para crear cuenta)
  "rejected",    // rechazado / falló
  "expired",     // expiró / abandonado
  "consumed",    // ya se creo user+tenant
]);

export const subscriptionPlanTable = pgTable("subscription_plans", {
  plan_id: serial().primaryKey(),

  key: varchar({ length: 64 }).notNull().unique(), // "starter", "pro"
  name: varchar({ length: 255 }).notNull(),

  price_amount: numeric({ precision: 12, scale: 2 }).notNull(),
  currency: varchar({ length: 8 }).notNull().default("ARS"),

  mp_preapproval_plan_id: varchar({ length: 128 }).notNull(), // MercadoPago ID

  is_active: boolean().notNull().default(true),

  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const signupIntentTable = pgTable("signup_intents", {
  intent_id: text("intent_id").primaryKey(),

  email: varchar({ length: 255 }).notNull(),
  password_hash: text("password_hash").notNull(),
  plan_id: integer("plan_id")
    .notNull()
    .references(() => subscriptionPlanTable.plan_id),

  status: signupIntentStatusEnum().notNull().default("created"),

  // Mercado Pago: suscripción creada (preapproval)
  mp_preapproval_id: varchar({ length: 128 }),

  // URL que redirige al usuario para pagar/autorizar
  mp_init_point: text("mp_init_point"),

  // para correlacionar webhooks sin usuario
  external_reference: varchar({ length: 128 }).notNull(), // ej: "signup:<intent_id>"

  // opcional: cuando MP confirma, guardás timestamps
  approved_at: timestamp({ withTimezone: true }),
  consumed_at: timestamp({ withTimezone: true }),

  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: index("signup_intents_email_idx").on(t.email),
  statusIdx: index("signup_intents_status_idx").on(t.status),
  extRefUnique: uniqueIndex("signup_intents_external_reference_unique").on(t.external_reference),
}));

export const userTable = pgTable("users", {
  user_id: serial().primaryKey(),
  email: varchar({ length: 255 }).notNull(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp({ withTimezone: true }).defaultNow(),
  role: userRoleEnum().default("user"),
  is_active: boolean().notNull().default(true),
  last_login: timestamp({ withTimezone: true }),
}, (t) => ({
  emailUnique: uniqueIndex("users_email_unique").on(t.email),
}));

export const userSettingsTable = pgTable("user_settings", {
  user_id: integer("user_id")
    .primaryKey()
    .references(() => userTable.user_id, { onDelete: "cascade" }),

  display_name: varchar({ length: 120 }),
  phone: varchar({ length: 32 }),
  email_notifications: boolean().notNull().default(true),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
});


export const tenantTable = pgTable("tenants", {
  tenant_id: serial().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  is_active: boolean().notNull().default(true),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  nameIdx: index("tenants_name_idx").on(t.name),
}));

export const tenantMembershipTable = pgTable("tenant_memberships", {
  membership_id: serial().primaryKey(),
  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
  user_id: integer("user_id")
    .notNull()
    .references(() => userTable.user_id, { onDelete: "cascade" }),
  role: tenantRoleEnum().notNull().default("staff"),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  is_active: boolean().notNull().default(true),
}, (t) => ({
  tenantUserUnique: uniqueIndex("tenant_memberships_tenant_user_unique").on(t.tenant_id, t.user_id),
  tenantIdx: index("tenant_memberships_tenant_idx").on(t.tenant_id),
  userIdx: index("tenant_memberships_user_idx").on(t.user_id),
}));

export const tenantSettingsTable = pgTable("tenant_settings", {
  tenant_id: integer("tenant_id")
    .primaryKey()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),

  business_name: varchar({ length: 255 }),

  logo_key: varchar({ length: 1024 }),          // tenants/12/logo/170...-abcd.png
  logo_mime: varchar({ length: 100 }),          // image/png, image/jpeg, image/webp
  logo_updated_at: timestamp({ withTimezone: true }),

  cuit: varchar({ length: 32 }),
  address: varchar({ length: 255 }),
  display_currency: varchar({ length: 8 }).notNull().default("ARS"),
  timezone: varchar({ length: 64 }).notNull().default("America/Argentina/Buenos_Aires"),
  low_stock_threshold_default: integer().notNull().default(3),

  updated_at: timestamp({ withTimezone: true }).notNull().defaultNow(),

  // billing
  subscription_status: subscriptionStatusEnum().notNull().default("inactive"),

  subscription_plan_id: integer("subscription_plan_id")
    .references(() => subscriptionPlanTable.plan_id),
  trial_ends_at: timestamp({ withTimezone: true }),

  mp_preapproval_id: varchar({ length: 128 }),
  subscription_started_at: timestamp({ withTimezone: true }),
  current_period_end: timestamp({ withTimezone: true }),

  last_mp_event_at: timestamp({ withTimezone: true }),
});

export const mpEventTable = pgTable("mp_events", {
  mp_event_id: text().primaryKey(), // id del evento MP

  intent_id: text("intent_id")
    .references(() => signupIntentTable.intent_id, { onDelete: "set null" }),

  topic: varchar({ length: 64 }).notNull(), // preapproval, payment, etc
  resource_id: varchar({ length: 128 }).notNull(),

  tenant_id: integer("tenant_id")
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),

  payload: jsonb().notNull(),

  received_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  processed_at: timestamp({ withTimezone: true }),
});


export const sessionTable = pgTable("sessions", {
    session_id: text().primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => userTable.user_id, { onDelete: "cascade" }),
    tenant_id: integer("tenant_id")
        .notNull()
        .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
    created_at: timestamp({ withTimezone: true })
      .notNull()
      .defaultNow(),
    expires_at: timestamp({ withTimezone: true }).notNull(),
    last_used: timestamp({ withTimezone: true }),
    revoked_at: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => ({
    user_idx: index("sessions_user_id_idx").on(t.user_id),
    expires_idx: index("sessions_expires_at_idx").on(t.expires_at),
  })
);


export const clientTable = pgTable("client", {
  client_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  id_number: bigint({ mode: "number" }).notNull(),
  birth_date: date(),
  debt: integer().default(0),
  is_deleted: boolean().default(false),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => ({
  tenantDeletedIdx: index("client_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
  tenantIdNumberUnique: uniqueIndex("client_tenant_id_number_unique").on(t.tenant_id, t.id_number),
}));
export type Client = InferSelectModel<typeof clientTable>

export const technicianTable = pgTable("technician", {
  technician_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  speciality: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  is_deleted: boolean().default(false),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => ({
  tenantDeletedIdx: index("technician_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
}));
export type Technician = InferSelectModel<typeof technicianTable>;

export const providerTable = pgTable("provider", {
  provider_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  phone_number: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  address: varchar("address", { length: 255 }).notNull(),
  is_deleted: boolean().default(false),
  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => ({
  tenantDeletedIdx: index("provider_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
}));
export type Provider = InferSelectModel<typeof providerTable>;


export const expenseTable = pgTable("expense", {
  expense_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  datetime: timestamp().notNull().defaultNow(),
  category: varchar({ length: 255 }).notNull(),
  description: varchar({ length: 255 }),
  amount: numeric({ precision: 12, scale: 2 }).notNull(),
  currency: varchar({ length: 8 }).notNull().default("USD"),
  payment_method: varchar({ length: 50 }).notNull(),

  receipt_key: varchar({ length: 1024 }),          // ej: tenants/12/expenses/99/170...-abcd.pdf
  receipt_original_name: varchar({ length: 255 }),
  receipt_mime: varchar({ length: 100 }),
  receipt_size: integer(),
  receipt_uploaded_at: timestamp(),

  provider_id: integer().references(() => providerTable.provider_id),
  is_deleted: boolean().default(false),
  sale_id: integer().references(() => saleTable.sale_id),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),

  created_by_user_id: integer("created_by_user_id").references(() => userTable.user_id),
}, (t) => ({
  tenantSaleIdx: index("expense_tenant_sale_idx").on(t.tenant_id, t.sale_id),
  tenantDeletedIdx: index("expense_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
  tenantDatetimeIdx: index("expense_tenant_datetime_idx").on(t.tenant_id, t.datetime),
}));
export type Expense = InferSelectModel<typeof expenseTable>;


export const phoneTable = pgTable("phone", {
  device_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  datetime: timestamp().notNull().defaultNow(),
  name: varchar({ length: 255 }).notNull(),
  brand: varchar({ length: 100 }).notNull(),
  imei: varchar({ length: 100 }).notNull(),
  device_type: varchar({ length: 100 }).notNull(),
  battery_health: integer(),
  storage_capacity: integer(),
  color: varchar({ length: 50 }),
  category: varchar({ length: 100 }).notNull(),
  price: numeric({ precision: 12, scale: 2 }).notNull(),
  buy_cost: numeric({ precision: 12, scale: 2 }).notNull(),
  currency_buy: varchar({ length: 8 }).notNull().default("USD"), 
  currency_sale: varchar({ length: 8 }).notNull().default("USD"), 
  deposit: varchar({ length: 255 }).notNull(),
  sold: boolean().default(false).notNull(),
  trade_in: boolean().default(false),
  is_deleted: boolean().default(false),
  in_repair: boolean().default(false),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => [
  index("phone_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
  index("phone_tenant_sold_idx").on(t.tenant_id, t.sold),
  index("phone_tenant_datetime_idx").on(t.tenant_id, t.datetime),
  uniqueIndex("phone_tenant_imei_unique").on(t.tenant_id, t.imei),
]);
export type Phone = InferSelectModel<typeof phoneTable>

export const accessoryTable = pgTable("accessory", {
  accessory_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  datetime: timestamp().notNull().defaultNow(),
  name: varchar({ length: 255 }).notNull(),
  brand: varchar({ length: 100 }).notNull(),
  stock: integer().notNull().default(0),
  color: varchar({ length: 50 }),
  category: varchar({ length: 100 }).notNull(),
  price: numeric({ precision: 12, scale: 2 }).notNull(),
  buy_cost: numeric({ precision: 12, scale: 2 }).notNull(),
  currency_buy: varchar({ length: 8 }).notNull().default("USD"),
  currency_sale: varchar({ length: 8 }).notNull().default("USD"), 
  deposit: varchar({ length: 255 }).notNull(),
  gift: boolean().default(false).notNull(),
  is_deleted: boolean().default(false),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => [
  index("accessory_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
  index("accessory_tenant_datetime_idx").on(t.tenant_id, t.datetime),
]);
export type Accessory = InferSelectModel<typeof accessoryTable>

export const repairTable = pgTable("repair", {
  repair_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  datetime: timestamp().notNull().defaultNow(),
  repair_state: varchar({ length: 100 }).notNull(),
  priority: varchar({ length: 50 }).notNull(),
  description: varchar({ length: 255 }).notNull(),
  diagnostic: varchar({ length: 255 }),
  client_cost: numeric({ precision: 12, scale: 2 }).notNull(),
  internal_cost: numeric({ precision: 12, scale: 2 }).notNull(),
  currency_buy: varchar({ length: 8 }).notNull().default("USD"), 
  currency_sale: varchar({ length: 8 }).notNull().default("USD"), 

  client_id: integer().references(() => clientTable.client_id).notNull(),
  technician_id: integer().references(() => technicianTable.technician_id).notNull(),
  device_id: integer().references(() => phoneTable.device_id).notNull(),

  is_deleted: boolean().default(false),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => ({
  tenantDeletedIdx: index("repair_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
  tenantDatetimeIdx: index("repair_tenant_datetime_idx").on(t.tenant_id, t.datetime),
}));
export type Repair = InferSelectModel<typeof repairTable>;


export const saleTable = pgTable("sale", {
  sale_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  datetime: timestamp().notNull().defaultNow(),
  total_amount: numeric({ precision: 12, scale: 2 }).notNull(),
  currency: varchar({ length: 8 }).notNull().default("USD"),
  payment_method: varchar({ length: 50 }).notNull(),
  debt: boolean().default(false).notNull(),
  debt_amount: numeric({ precision: 12, scale: 2 }),

  client_id: integer().references(() => clientTable.client_id).notNull(),
  seller_id: integer().references(() => sellerTable.seller_id).notNull(),
  device_id: integer().references(() => phoneTable.device_id).notNull(),
  trade_in_device: integer().references(() => phoneTable.device_id),

  is_deleted: boolean().default(false),

  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => ({
  tenantDeletedIdx: index("sale_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
  tenantDatetimeIdx: index("sale_tenant_datetime_idx").on(t.tenant_id, t.datetime),
}));
export type Sale = InferSelectModel<typeof saleTable>;

export const saleGiftAccessoryTable = pgTable(
  "sale_gift_accessory",
  {
    sale_gift_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    sale_id: integer().notNull().references(() => saleTable.sale_id, { onDelete: "cascade" }),
    accessory_id: integer().notNull().references(() => accessoryTable.accessory_id, { onDelete: "restrict" }),
    qty: integer().notNull().default(1),
    unit_price: numeric({ precision: 12, scale: 2 }).notNull(),
    unit_buy_cost: numeric({ precision: 12, scale: 2 }).notNull(),

    tenant_id: integer("tenant_id")
      .notNull()
      .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),

    is_deleted: boolean().default(false),
  },
  (t) => ({
    saleIdx: index("sale_gift_sale_idx").on(t.tenant_id, t.sale_id),
    accessoryIdx: index("sale_gift_accessory_idx").on(t.tenant_id, t.accessory_id),
    uniq: unique("sale_gift_unique").on(t.sale_id, t.accessory_id),
  })
);
export type SaleGiftAccessory = InferSelectModel<typeof saleGiftAccessoryTable>;

export const sellerTable = pgTable("seller", {
  seller_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  hire_date: date().notNull().default(sql`CURRENT_DATE`),
  pay_date: date().default(sql`CURRENT_DATE`),
  commission: numeric({ precision: 5, scale: 2 }).default("0.00"),
  is_deleted: boolean().default(false),
  tenant_id: integer("tenant_id")
    .notNull()
    .references(() => tenantTable.tenant_id, { onDelete: "cascade" }),
}, (t) => ({
  tenantDeletedIdx: index("seller_tenant_deleted_idx").on(t.tenant_id, t.is_deleted),
}));
export type Seller = InferSelectModel<typeof sellerTable>;
