import { clientTable } from './schema';
import { createInsertSchema } from 'drizzle-typebox';
import { t } from 'Elysia';

export const clientInsertSchema = createInsertSchema(clientTable);
export const clientInsertDTO = t.Omit(clientInsertSchema, ["client_id"]);
export const clientUpdateDTO = clientInsertDTO.partial();