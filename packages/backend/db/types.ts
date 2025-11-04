import { clientTable, technicianTable, phoneTable } from './schema';
import { createInsertSchema } from 'drizzle-typebox';
import { t } from 'elysia';

export const clientInsertSchema = createInsertSchema(clientTable);
export const clientInsertDTO = t.Omit(clientInsertSchema, ["client_id"]);
export const clientUpdateDTO = t.Omit(clientInsertSchema, ["client_id"]);


export const technicianSchema = createInsertSchema(technicianTable);
export const technicianInsertDTO = t.Omit(technicianSchema, ["technician_id"]);
export const technicianUpdateDTO = t.Omit(technicianSchema, ["technician_id"]);

export const phoneSchema = createInsertSchema(phoneTable);
export const phoneInsertDTO = t.Omit(phoneSchema, ["device_id"]);
export const phoneUpdateDTO = t.Omit(phoneSchema, ["device_id"]);