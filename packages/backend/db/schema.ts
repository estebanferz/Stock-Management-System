import { integer, pgTable, varchar, date, bigint, numeric, timestamp, boolean } from "drizzle-orm/pg-core";

export const clientTable = pgTable("client", {
  client_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  id_number: bigint({mode: "number"}).notNull().unique(),
  birth_date: date(),
});

export const technicianTable = pgTable("technician", {
  technician_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }),
  phone_number: varchar({ length: 16 }),
  speciality: varchar({ length: 255 }),
  birth_date: date(),
});

export const providerTable = pgTable("provider", {                          
  provider_id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  phone_number: varchar({length: 255}).notNull(),
  email: varchar({ length: 255 }),
  address: varchar('address', { length: 255 }).notNull(),
});

export const expenseTable = pgTable("expense", {
    expense_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull(),
    catergory: varchar({ length: 255 }).notNull(),
    description: varchar({ length: 255 }),
    amount: numeric({precision: 2, scale: 12}).notNull(),
    payment_method: varchar({ length: 50 }).notNull(),
    receipt_number: varchar({ length: 100 }).unique(),
    provider_id: 
        integer()
        .references(() => providerTable.provider_id),
});

export const phoneTable = pgTable("phone", {
    device_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    brand: varchar({ length: 100 }).notNull(),
    imei: varchar({ length: 100 }).unique().notNull(),
    device_type: varchar({ length: 100 }), // e.g., "Just one", "wholesaler"
    battery_health: integer(),
    storage_capacity: integer(),
    color: varchar({ length: 50 }),
    category: varchar({ length: 100 }).notNull(), // e.g., "As is", "Refurbished", "New"
    price: numeric({precision: 2, scale: 12}).notNull(),
    buy_cost: numeric({precision: 2, scale: 12}).notNull(),
    deposit: varchar({length: 255}).notNull(),
    sold: boolean().default(false).notNull(),
});

export const repairTable = pgTable("repair", {
    repair_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull(),
    repair_state: varchar({ length: 100 }).notNull(),   // e.g., "Pending", "In Progress", "Completed"
    priority: varchar({ length: 50 }).notNull(), // e.g., "Low", "Medium", "High"
    description: varchar({ length: 255 }).notNull(),
    diagnostic: varchar({ length: 255 }),
    client_cost: numeric({precision: 2, scale: 12}).notNull(),
    internal_cost: numeric({precision: 2, scale: 12}).notNull(),
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
});

export const saleTable = pgTable("sale", {
    sale_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    datetime: timestamp().notNull(),
    total_amount: numeric({precision: 2, scale: 12}).notNull(),
    payment_method: varchar({ length: 50 }).notNull(),
    debt: boolean().default(false).notNull(),
    debt_amount: numeric({precision: 2, scale: 12}).notNull(),
    client_id: 
        integer()
        .references(() => clientTable.client_id),
    seller_id:
        integer()
        .references(() => sellerTable.seller_id),
    device_id: 
        integer()
        .references(() => phoneTable.device_id)
        .notNull(),
});

export const sellerTable = pgTable("seller", {                                   //PREGUNTAR
    seller_id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull(),
    email: varchar({ length: 255 }),
    phone_number: varchar({ length: 16 }),
    hire_date: date(),
});