// src/middlewares/requireAuth.ts
import { Elysia } from "elysia";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../../db/db";
import { sessionTable, userTable } from "../../db/schema";

const SESSION_COOKIE = "session";

export type AuthedUser = {
  user_id: number;
  email: string;
  role: "user" | "admin" | null;
  is_active: boolean;
};

export const requireAuth = new Elysia({ name: "requireAuth" })
    .derive(async ({ cookie, set }) => {
        const raw = cookie[SESSION_COOKIE]?.value;
        const sessionId = typeof raw === "string" ? raw : undefined;

        if (!sessionId) {
        set.status = 401;
        return { user: null as AuthedUser | null } as const;
        }

        const now = new Date();

        const session = await db
        .select({ user_id: sessionTable.user_id })
        .from(sessionTable)
        .where(and(eq(sessionTable.session_id, sessionId), gt(sessionTable.expires_at, now)))
        .limit(1);

        const [s] = session;
        if (!s) {
        set.status = 401;
        return { user: null as AuthedUser | null } as const;
        }

        const userRes = await db
        .select({
            user_id: userTable.user_id,
            email: userTable.email,
            role: userTable.role,
            is_active: userTable.is_active,
        })
        .from(userTable)
        .where(eq(userTable.user_id, s.user_id))
        .limit(1);

        const user = userRes[0];
        if (!user || user.is_active === false) {
        set.status = 401;
        return { user: null as AuthedUser | null } as const;
        }

        return { user } as const;
    })
    .onBeforeHandle(({ user, set }) => {
        if (!user?.user_id) {
        set.status = 401;
        return { ok: false, message: "Unauthorized" };
        }
    })
    .as("scoped");
