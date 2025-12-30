import { db } from "../../db/db";
import { userTable, sessionTable } from "../../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import { type AuthUser } from "@server/db/types";
import { SESSION_DAYS, ROUNDS } from "@server/db/types";


function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function makeSessionId() {
  return randomBytes(32).toString("hex");
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

type ServiceResult =
  | { ok: true; status: 200 | 201; user: AuthUser; sessionId: string }
  | { ok: false; status: number; message: string };

export async function register(
  emailRaw: string,
  password: string
): Promise<ServiceResult> {
  const email = normalizeEmail(emailRaw);

  const existing = await db
    .select({ user_id: userTable.user_id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (existing.length) {
    return { ok: false, status: 409, message: "Email already in use" };
  }

  const passwordHash = await hash(password, ROUNDS);

  const inserted = await db
    .insert(userTable)
    .values({
      email,
      password_hash: passwordHash,
    })
    .returning({
      user_id: userTable.user_id,
      email: userTable.email,
      role: userTable.role,
    });

  const userRow = inserted[0];
  if (!userRow) {
    return { ok: false, status: 500, message: "Failed to create user" };
  }

  const sessionId = makeSessionId();
  const now = new Date();
  const expiresAt = addDays(now, SESSION_DAYS);

  await db.insert(sessionTable).values({
    session_id: sessionId,
    user_id: userRow.user_id,
    expires_at: expiresAt,
  });

  return {
    ok: true,
    status: 201,
    user: { id: userRow.user_id, email: userRow.email, role: userRow.role ?? "user" },
    sessionId,
  };
}


export async function login(emailRaw: string, password: string): Promise<ServiceResult> {
  const email = normalizeEmail(emailRaw);

  const users = await db
    .select({
      user_id: userTable.user_id,
      email: userTable.email,
      password_hash: userTable.password_hash,
      role: userTable.role, 
      is_active: userTable.is_active,
    })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

    const [user] = users;
    if (!user) {
        return { ok: false, status: 401, message: "Invalid credentials" };
    }

    if (user.is_active === false) {
        return { ok: false, status: 401, message: "Invalid credentials" };
    }

    const passOk = await compare(password, user.password_hash);
    if (!passOk) {
        return { ok: false, status: 401, message: "Invalid credentials" };
    }

    await db.delete(sessionTable).where(eq(sessionTable.user_id, user.user_id));

    const sessionId = makeSessionId();
    const now = new Date();
    const expiresAt = addDays(now, SESSION_DAYS);

    await db.insert(sessionTable).values({
        session_id: sessionId,
        user_id: user.user_id,
        expires_at: expiresAt,
    });

    // last_login
    await db.update(userTable).set({ last_login: now }).where(eq(userTable.user_id, user.user_id));

    return {
        ok: true,
        status: 200,
        user: { id: user.user_id, email: user.email, role: user.role },
        sessionId,
    };
}

export async function logout(sessionId: string) {
  await db
    .update(sessionTable)
    .set({ revoked_at: new Date() })
    .where(eq(sessionTable.session_id, sessionId));
}

export async function me(sessionId?: string | null): Promise<
  | { ok: true; status: 200; user: AuthUser }
  | { ok: false; status: 401 }
> {
  if (!sessionId) return { ok: false, status: 401 };

  const now = new Date();

  const session = await db
    .select({
      session_id: sessionTable.session_id,
      user_id: sessionTable.user_id,
      expires_at: sessionTable.expires_at,
      revoked_at: sessionTable.revoked_at,
    })
    .from(sessionTable)
    .where(and(
      eq(sessionTable.session_id, sessionId),
      gt(sessionTable.expires_at, now),
      isNull(sessionTable.revoked_at)
    ))
    .limit(1);
    
    const [s] = session;
    
    if (!s) return { ok: false, status: 401 };


  const users = await db
    .select({
      user_id: userTable.user_id,
      email: userTable.email,
      rol: userTable.role,
      is_active: userTable.is_active,
    })
    .from(userTable)
    .where(eq(userTable.user_id, s.user_id))
    .limit(1);

    const [user] = users;

    if (!user) return { ok: false, status: 401 };

    if (user.is_active === false) {
        return { ok: false, status: 401 };
    }

    // last_used
    await db.update(sessionTable).set({ last_used: now }).where(eq(sessionTable.session_id, sessionId));

    return {
        ok: true,
        status: 200,
        user: { id: user.user_id, email: user.email, role: user.rol },
    };
}
