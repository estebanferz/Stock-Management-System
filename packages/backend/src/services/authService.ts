// authService.ts
import { db } from "../../db/db";
import {
  userTable,
  sessionTable,
  tenantTable,
  tenantMembershipTable,
  tenantSettingsTable,
  userSettingsTable,
} from "../../db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import {
  SESSION_DAYS,
  ROUNDS,
  type AuthTenant,
  type TenantSettings,
  type AuthUser,
  type UserSettings,
} from "@server/db/types";
import { PgRole } from "drizzle-orm/pg-core";

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

function pickBestMembership(memberships: Array<{ tenant_id: number; role: TenantRole }>) {
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
    .where(and(eq(tenantMembershipTable.user_id, userId), eq(tenantMembershipTable.is_active, true)));

  const best = memberships.length ? pickBestMembership(memberships as any) : null;
  return best; // { tenant_id, role } | null
}

type ServiceResult =
  | {
      ok: true;
      status: 200 | 201;
      user: AuthUser;
      sessionId: string;
      tenant: AuthTenant;
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
  const trialEndsAt = addDays(now, 7);

  const result = await db.transaction(async (tx) => {
    const insertedUser = await tx
      .insert(userTable)
      .values({ email, password_hash: passwordHash })
      .returning({
        user_id: userTable.user_id,
        email: userTable.email,
        role: userTable.role,
        is_active: userTable.is_active,
        created_at: userTable.created_at,
        last_login: userTable.last_login,
      });

    const userRow = insertedUser[0];
    if (!userRow) throw new Error("Failed to create user");

    const insertedTenant = await tx
      .insert(tenantTable)
      .values({ name: `Negocio de ${email}` })
      .returning({
        tenant_id: tenantTable.tenant_id,
        name: tenantTable.name,
        is_active: tenantTable.is_active,
        created_at: tenantTable.created_at,
        updated_at: tenantTable.updated_at,
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
      display_currency: "ARS",
      timezone: "America/Argentina/Buenos_Aires",
      low_stock_threshold_default: 3,
      subscription_status: "trial",
      trial_ends_at: trialEndsAt,
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
    user: {
      id: result.userRow.user_id,
      email: result.userRow.email,
      role: result.userRow.role ?? "user",
      is_active: result.userRow.is_active ?? true,
      created_at: result.userRow.created_at ?? null,
      last_login: result.userRow.last_login ?? null,
    },
    sessionId,
    tenant: {
      id: result.tenantRow.tenant_id,
      name: result.tenantRow.name ?? null,
      is_active: result.tenantRow.is_active ?? true,
      created_at: result.tenantRow.created_at ?? null,
      updated_at: result.tenantRow.updated_at ?? null,
    },
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
      created_at: userTable.created_at,
      last_login: userTable.last_login,
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
    .select({
      tenant_id: tenantTable.tenant_id,
      name: tenantTable.name,
      is_active: tenantTable.is_active,
      created_at: tenantTable.created_at,
      updated_at: tenantTable.updated_at,
    })
    .from(tenantTable)
    .where(eq(tenantTable.tenant_id, membership.tenant_id))
    .limit(1);

  const tenant = tenantRows[0];
  if (!tenant || tenant.is_active === false) {
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
    user: {
      id: user.user_id,
      email: user.email,
      role: user.role ?? "user",
      is_active: user.is_active ?? true,
      created_at: user.created_at ?? null,
      // ojo: acabamos de actualizar last_login en DB; acá devolvemos "now"
      last_login: now,
    },
    sessionId,
    tenant: {
      id: tenant.tenant_id,
      name: tenant.name ?? null,
      is_active: tenant.is_active ?? true,
      created_at: tenant.created_at ?? null,
      updated_at: tenant.updated_at ?? null,
    },
    roleInTenant: membership.role as TenantRole,
  };
}

export async function logout(sessionId: string) {
  await db.update(sessionTable).set({ revoked_at: new Date() }).where(eq(sessionTable.session_id, sessionId));
}

export type MeOk = {
  ok: true;
  status: 200;
  user: AuthUser;
  tenant: AuthTenant;
  roleInTenant: "owner" | "admin" | "staff";
  tenantSettings: TenantSettings | null;
  userSettings: UserSettings | null;
};

type MeFail = { ok: false; status: 401 };

export async function me(sessionId?: string | null): Promise<MeOk | MeFail> {
  if (!sessionId) return { ok: false, status: 401 };

  const now = new Date();

  const rows = await db
    .select({
      // session/user base
      user_id: userTable.user_id,
      email: userTable.email,
      user_role: userTable.role,
      user_active: userTable.is_active,
      user_created_at: userTable.created_at,
      user_last_login: userTable.last_login,

      //suscription
      ts_subscription_status: tenantSettingsTable.subscription_status,
      ts_trial_ends_at: tenantSettingsTable.trial_ends_at,

      // tenant base
      tenant_id: tenantTable.tenant_id,
      tenant_name: tenantTable.name,
      tenant_active: tenantTable.is_active,
      tenant_created_at: tenantTable.created_at,
      tenant_updated_at: tenantTable.updated_at,

      // membership
      membership_role: tenantMembershipTable.role,
      membership_active: tenantMembershipTable.is_active,

      // tenant_settings (LEFT JOIN)
      ts_business_name: tenantSettingsTable.business_name,
      ts_logo_url: tenantSettingsTable.logo_url,
      ts_cuit: tenantSettingsTable.cuit,
      ts_address: tenantSettingsTable.address,
      ts_display_currency: tenantSettingsTable.display_currency,
      ts_timezone: tenantSettingsTable.timezone,
      ts_low_stock: tenantSettingsTable.low_stock_threshold_default,
      ts_updated_at: tenantSettingsTable.updated_at,
      
      // user_settings (LEFT JOIN)
      us_user_id: userSettingsTable.user_id,
      us_display_name: userSettingsTable.display_name,
      us_phone: userSettingsTable.phone,
      us_email_notifications: userSettingsTable.email_notifications,
      us_updated_at: userSettingsTable.updated_at,
    })
    .from(sessionTable)
    .innerJoin(userTable, eq(sessionTable.user_id, userTable.user_id))
    .innerJoin(tenantTable, eq(sessionTable.tenant_id, tenantTable.tenant_id))
    .leftJoin(tenantSettingsTable, eq(tenantSettingsTable.tenant_id, tenantTable.tenant_id))
    .leftJoin(userSettingsTable, eq(userSettingsTable.user_id, userTable.user_id))
    .innerJoin(
      tenantMembershipTable,
      and(eq(tenantMembershipTable.user_id, userTable.user_id), eq(tenantMembershipTable.tenant_id, tenantTable.tenant_id))
    )
    .where(and(eq(sessionTable.session_id, sessionId), gt(sessionTable.expires_at, now), isNull(sessionTable.revoked_at)))
    .limit(1);

  const r = rows[0];
  if (!r) return { ok: false, status: 401 };

  if (r.user_active === false) return { ok: false, status: 401 };
  if (r.tenant_active === false) return { ok: false, status: 401 };
  if (r.membership_active === false) return { ok: false, status: 401 };

  // last_used
  await db.update(sessionTable).set({ last_used: now }).where(eq(sessionTable.session_id, sessionId));

  const hasTenantSettingsRow =
    r.ts_updated_at !== null ||
    r.ts_business_name !== null ||
    r.ts_logo_url !== null ||
    r.ts_cuit !== null ||
    r.ts_address !== null;

  const tenantSettings: TenantSettings | null = hasTenantSettingsRow
    ? {
        business_name: r.ts_business_name ?? null,
        logo_url: r.ts_logo_url ?? null,
        cuit: r.ts_cuit ?? null,
        address: r.ts_address ?? null,
        display_currency: r.ts_display_currency ?? "ARS",
        timezone: r.ts_timezone ?? "America/Argentina/Buenos_Aires",
        low_stock_threshold_default: r.ts_low_stock ?? 3,
        updated_at: r.ts_updated_at ?? null,
        trial_ends_at: r.ts_trial_ends_at ?? null,
        subscription_status: r.ts_subscription_status ?? null,
      }
    : null;
  
  const hasUserSettingsRow = r.us_user_id !== null;

  const userSettings = hasUserSettingsRow
    ? {
        display_name: r.us_display_name ?? null,
        phone: r.us_phone ?? null,
        email_notifications: r.us_email_notifications ?? true,
        updated_at: r.us_updated_at ?? null,
      }
    : null;

  return {
    ok: true,
    status: 200,
    user: {
      id: r.user_id,
      email: r.email,
      role: r.user_role ?? "user",
      is_active: r.user_active ?? true,
      created_at: r.user_created_at ?? null,
      last_login: r.user_last_login ?? null,
    },
    tenant: {
      id: r.tenant_id,
      name: r.tenant_name ?? null,
      is_active: r.tenant_active ?? true,
      created_at: r.tenant_created_at ?? null,
      updated_at: r.tenant_updated_at ?? null,
    },
    roleInTenant: r.membership_role,
    tenantSettings,
    userSettings,
  };
}
