import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "./schema";


export const connection = await postgres(process.env.DB_URL as string);

export const db = drizzle(connection, { schema });