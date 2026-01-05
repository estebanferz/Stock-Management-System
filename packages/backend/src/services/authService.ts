// authService.ts
import { db } from "../../db/db";
import {
  userTable,
  sessionTable,
  tenantTable,
  tenantMembershipTable,
  tenantSettingsTable,
} from "../../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
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

type TenantRole = "owner" | "admin" | "staff";

function pickBestMembership(
  memberships: Array<{ tenant_id: number; role: TenantRole }>
) {
  const rank: Record<TenantRole, number> = { owner: 3, admin: 2, staff: 1 };
  return memberships.sort((a, b) => (rank[b.role] ?? 0) - (rank[a.role] ?? 0))[0];
}

async function getDefaultTenantForUser(userId: number) {
  const memberships = await db
    .select({
      tenant_id: tenantMembershipTable.tenant_id,
      role: tenantMembershipTable.role,
    })
    .from(tenantMembershipTable)
    .where(
      and(
        eq(tenantMembershipTable.user_id, userId),
        eq(tenantMembershipTable.is_active, true)
      )
    );

  const best = memberships.length
    ? pickBestMembership(memberships as any)
    : null;

  return best; // { tenant_id, role } | null
}

type AuthUser = { id: number; email: string; role?: string | null };

type ServiceResult =
  | {
      ok: true;
      status: 200 | 201;
      user: AuthUser;
      sessionId: string;
      tenant: { id: number; name: string };
      roleInTenant: TenantRole;
    }
  | { ok: false; status: number; message: string };

export async function register(emailRaw: string, password: string): Promise<ServiceResult> {
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
  const now = new Date();
  const expiresAt = addDays(now, SESSION_DAYS);
  const sessionId = makeSessionId();

  const result = await db.transaction(async (tx) => {
    const insertedUser = await tx
      .insert(userTable)
      .values({ email, password_hash: passwordHash })
      .returning({
        user_id: userTable.user_id,
        email: userTable.email,
        role: userTable.role,
      });

    const userRow = insertedUser[0];
    if (!userRow) throw new Error("Failed to create user");

    const insertedTenant = await tx
      .insert(tenantTable)
      .values({ name: `Negocio de ${email}` })
      .returning({
        tenant_id: tenantTable.tenant_id,
        name: tenantTable.name,
      });

    const tenantRow = insertedTenant[0];
    if (!tenantRow) throw new Error("Failed to create tenant");

    // Membership owner
    await tx.insert(tenantMembershipTable).values({
      tenant_id: tenantRow.tenant_id,
      user_id: userRow.user_id,
      role: "owner",
    });

    // Settings default (opcional pero prolijo)
    await tx.insert(tenantSettingsTable).values({
      tenant_id: tenantRow.tenant_id,
      // defaults ya están en schema, esto queda explícito
      default_currency: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      low_stock_threshold_default: 3,
    });

    // Session con tenant_id (OBLIGATORIO)
    await tx.insert(sessionTable).values({
      session_id: sessionId,
      user_id: userRow.user_id,
      tenant_id: tenantRow.tenant_id,
      expires_at: expiresAt,
    });

    return { userRow, tenantRow };
  });

  return {
    ok: true,
    status: 201,
    user: { id: result.userRow.user_id, email: result.userRow.email, role: result.userRow.role ?? "user" },
    sessionId,
    tenant: { id: result.tenantRow.tenant_id, name: result.tenantRow.name },
    roleInTenant: "owner",
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
  if (!user || user.is_active === false) {
    return { ok: false, status: 401, message: "Invalid credentials" };
  }

  const passOk = await compare(password, user.password_hash);
  if (!passOk) {
    return { ok: false, status: 401, message: "Invalid credentials" };
  }

  const membership = await getDefaultTenantForUser(user.user_id);
  if (!membership) {
    return { ok: false, status: 403, message: "User has no tenant membership" };
  }

  const tenantRows = await db
    .select({ tenant_id: tenantTable.tenant_id, name: tenantTable.name })
    .from(tenantTable)
    .where(eq(tenantTable.tenant_id, membership.tenant_id))
    .limit(1);

  const tenant = tenantRows[0];
  if (!tenant) {
    return { ok: false, status: 403, message: "Tenant not found" };
  }

  // Tu comportamiento actual: 1 sesión por user
  await db.delete(sessionTable).where(eq(sessionTable.user_id, user.user_id));

  const sessionId = makeSessionId();
  const now = new Date();
  const expiresAt = addDays(now, SESSION_DAYS);

  await db.insert(sessionTable).values({
    session_id: sessionId,
    user_id: user.user_id,
    tenant_id: tenant.tenant_id,
    expires_at: expiresAt,
  });

  await db.update(userTable).set({ last_login: now }).where(eq(userTable.user_id, user.user_id));

  return {
    ok: true,
    status: 200,
    user: { id: user.user_id, email: user.email, role: user.role },
    sessionId,
    tenant: { id: tenant.tenant_id, name: tenant.name },
    roleInTenant: membership.role as TenantRole,
  };
}

export async function logout(sessionId: string) {
  await db
    .update(sessionTable)
    .set({ revoked_at: new Date() })
    .where(eq(sessionTable.session_id, sessionId));
}

type MeOk = {
  ok: true;
  status: 200;
  user: AuthUser;
  tenant: { id: number; name: string | null };
  roleInTenant: "owner" | "admin" | "staff";
};

type MeFail = { ok: false; status: 401 };

export async function me(sessionId?: string | null): Promise<MeOk | MeFail> {
  if (!sessionId) return { ok: false, status: 401 };

  const now = new Date();

  const rows = await db
    .select({
      session_id: sessionTable.session_id,
      expires_at: sessionTable.expires_at,
      revoked_at: sessionTable.revoked_at,

      user_id: userTable.user_id,
      email: userTable.email,
      user_role: userTable.role,
      user_active: userTable.is_active,

      tenant_id: tenantTable.tenant_id,
      tenant_name: tenantTable.name,
      tenant_active: tenantTable.is_active,

      membership_role: tenantMembershipTable.role,
      membership_active: tenantMembershipTable.is_active,
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.user_id, userTable.user_id))
    .innerJoin(tenantTable, eq(sessionTable.tenant_id, tenantTable.tenant_id))
    .innerJoin(
      tenantMembershipTable,
      and(
        eq(tenantMembershipTable.user_id, userTable.user_id),
        eq(tenantMembershipTable.tenant_id, tenantTable.tenant_id)
      )
    )
    .where(
      and(
        eq(sessionTable.session_id, sessionId),
        gt(sessionTable.expires_at, now),
        isNull(sessionTable.revoked_at)
      )
    )
    .limit(1);

  const r = rows[0];
  if (!r) return { ok: false, status: 401 };

  // ✅ validaciones duras
  if (r.user_active === false) return { ok: false, status: 401 };
  if (r.tenant_active === false) return { ok: false, status: 401 };
  if (r.membership_active === false) return { ok: false, status: 401 };

  // last_used
  await db
    .update(sessionTable)
    .set({ last_used: now })
    .where(eq(sessionTable.session_id, sessionId));

  return {
    ok: true,
    status: 200,
    user: { id: r.user_id, email: r.email, role: r.user_role ?? "user" },
    tenant: { id: r.tenant_id, name: r.tenant_name ?? null },
    roleInTenant: r.membership_role,
  };
}