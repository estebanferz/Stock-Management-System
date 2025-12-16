import { integer, pgTable, varchar, date, bigint, numeric, timestamp, boolean } from "drizzle-orm/pg-core";
import { type InferSelectModel, sql } from "drizzle-orm"


export const clientTable = pgTable("client", {
  client_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  id_number: bigint({mode: "number"}).notNull().unique(),
  birth_date: date(),
  debt: integer().default(0),
  is_deleted: boolean().default(false),
});
export type Client = InferSelectModel<typeof clientTable>

export const technicianTable = pgTable("technician", {
  technician_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  speciality: varchar({ length: 255 }).notNull(),
  state: varchar({ length: 100 }).notNull(),
  is_deleted: boolean().default(false),
});
export type Technician = InferSelectModel<typeof technicianTable>

export const providerTable = pgTable("provider", {                          
  provider_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  phone_number: varchar({length: 255}).notNull(),
  email: varchar({ length: 255 }),
  address: varchar('address', { length: 255 }).notNull(),
  is_deleted: boolean().default(false),
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
});
export type Expense = InferSelectModel<typeof expenseTable>

export const phoneTable = pgTable("phone", {
    device_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull().defaultNow(),
    name: varchar({ length: 255 }).notNull(),
    brand: varchar({ length: 100 }).notNull(),
    imei: varchar({ length: 100 }).unique().notNull(),
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
});
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
});
export type Seller = InferSelectModel<typeof sellerTable>