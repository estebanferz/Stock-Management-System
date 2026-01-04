import { index, integer, pgTable, varchar, date, bigint, numeric, timestamp, boolean, text, pgEnum, serial, uniqueIndex } from "drizzle-orm/pg-core";
import { type InferSelectModel, sql } from "drizzle-orm"

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);

export const userTable = pgTable("users", {
    user_id: serial().primaryKey(),    
    email: varchar({ length: 255 }).notNull(),
    password_hash: text("password_hash").notNull(),
    created_at: timestamp({ withTimezone: true }).defaultNow(),
    role: userRoleEnum().default("user"),
    is_active: boolean().notNull().default(true),
    last_login: timestamp({ withTimezone: true }),
})

export const sessionTable = pgTable("sessions", {
    session_id: text().primaryKey(),
    user_id: integer("user_id")
      .notNull()
      .references(() => userTable.user_id, { onDelete: "cascade" }),
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
    id_number: bigint({mode: "number"}).notNull().unique(),
    birth_date: date(),
    debt: integer().default(0),
    is_deleted: boolean().default(false),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
},
  (t) => ({
    userDeletedIdx: index("client_user_deleted_idx").on(t.user_id, t.is_deleted),
    userIdNumberUnique: uniqueIndex("client_user_id_number_unique").on(t.user_id, t.id_number),
  })
);
export type Client = InferSelectModel<typeof clientTable>

export const technicianTable = pgTable("technician", {
    technician_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }),
    phone_number: varchar({ length: 16 }),
    speciality: varchar({ length: 255 }).notNull(),
    state: varchar({ length: 100 }).notNull(),
    is_deleted: boolean().default(false),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
});
export type Technician = InferSelectModel<typeof technicianTable>

export const providerTable = pgTable("provider", {                          
    provider_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    phone_number: varchar({length: 255}).notNull(),
    email: varchar({ length: 255 }),
    address: varchar('address', { length: 255 }).notNull(),
    is_deleted: boolean().default(false),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
});
export type Provider = InferSelectModel<typeof providerTable>

export const expenseTable = pgTable("expense", {
    expense_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull().defaultNow(),
    category: varchar({ length: 255 }).notNull(), // e.g., "Marketing", "Utilities", "Repairs"
    description: varchar({ length: 255 }),
    amount: numeric({precision: 12, scale: 2}).notNull(),
    payment_method: varchar({ length: 50 }).notNull(),
    receipt_path: varchar({ length: 255 }),
    receipt_original_name: varchar({ length: 255 }),
    receipt_mime: varchar({ length: 100 }),
    receipt_size: integer(),
    provider_id: 
        integer()
        .references(() => providerTable.provider_id),
    is_deleted: boolean().default(false),
        user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
});
export type Expense = InferSelectModel<typeof expenseTable>

export const phoneTable = pgTable("phone", {
    device_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull().defaultNow(),
    name: varchar({ length: 255 }).notNull(),
    brand: varchar({ length: 100 }).notNull(),
    imei: varchar({ length: 100 }).notNull(),
    device_type: varchar({ length: 100 }).notNull(), // e.g., "Just one", "wholesaler"
    battery_health: integer(),
    storage_capacity: integer(),
    color: varchar({ length: 50 }),
    category: varchar({ length: 100 }).notNull(), // e.g., "As is", "Refurbished", "New"
    price: numeric({precision: 12, scale: 2}).notNull(),
    buy_cost: numeric({precision: 12, scale: 2}).notNull(),
    deposit: varchar({length: 255}).notNull(),
    sold: boolean().default(false).notNull(),
    trade_in: boolean().default(false),
    is_deleted: boolean().default(false),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
},
(t) => [
    index("phone_user_deleted_idx").on(t.user_id, t.is_deleted),
    index("phone_user_sold_idx").on(t.user_id, t.sold),
    index("phone_user_datetime_idx").on(t.user_id, t.datetime),
    uniqueIndex("phone_user_imei_unique").on(t.user_id, t.imei),
]);
export type Phone = InferSelectModel<typeof phoneTable>

export const repairTable = pgTable("repair", {
    repair_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull().defaultNow(),
    repair_state: varchar({ length: 100 }).notNull(),   // e.g., "Pending", "In Progress", "Completed"
    priority: varchar({ length: 50 }).notNull(), // e.g., "Low", "Medium", "High"
    description: varchar({ length: 255 }).notNull(),
    diagnostic: varchar({ length: 255 }),
    client_cost: numeric({precision: 12, scale: 2}).notNull(),
    internal_cost: numeric({precision: 12, scale: 2}).notNull(),
    client_id: 
        integer()
        .references(() => clientTable.client_id)
        .notNull(),
    technician_id: 
        integer()
        .references(() => technicianTable.technician_id)
        .notNull(),
    device_id: 
        integer()  
        .references(() => phoneTable.device_id)
        .notNull(),
    is_deleted: boolean().default(false),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
});
export type Repair = InferSelectModel<typeof repairTable>

export const saleTable = pgTable("sale", {
    sale_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull().defaultNow(),
    total_amount: numeric({precision: 12, scale: 2}).notNull(),
    payment_method: varchar({ length: 50 }).notNull(),
    debt: boolean().default(false).notNull(),
    debt_amount: numeric({precision: 12, scale: 2}),
    client_id: 
        integer()
        .references(() => clientTable.client_id)
        .notNull(),
    seller_id:
        integer()
        .references(() => sellerTable.seller_id)
        .notNull(),
    device_id: 
        integer()
        .references(() => phoneTable.device_id)
        .notNull(),
    is_deleted: boolean().default(false),
    trade_in_device: integer()
        .references(() => phoneTable.device_id),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
});
export type Sale = InferSelectModel<typeof saleTable>


export const sellerTable = pgTable("seller", {                                   
    seller_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    age: integer().notNull(),
    email: varchar({ length: 255 }),
    phone_number: varchar({ length: 16 }),
    hire_date: date().notNull().default(sql`CURRENT_DATE`),
    pay_date: date().default(sql`CURRENT_DATE`),
    commission: numeric({precision: 5, scale: 2}).default("0.00"), // Percentage (e.g., 5.00 for 5%)
    is_deleted: boolean().default(false),
    user_id: integer("user_id")
        .notNull()
        .references(() => userTable.user_id, { onDelete: "cascade" })
});
export type Seller = InferSelectModel<typeof sellerTable>