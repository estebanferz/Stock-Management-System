import { and, eq } from "drizzle-orm";
import { db } from "@server/db/db"; // ajustá si tu import es distinto
import {
  userTable,
  tenantMembershipTable,
  sessionTable,
} from "@server/db/schema";
import { userSettingsTable } from "@server/db/schema";

async function assertActiveMembership(tenantId: number, userId: number) {
  const [m] = await db
    .select({
      is_active: tenantMembershipTable.is_active,
      role: tenantMembershipTable.role,
    })
    .from(tenantMembershipTable)
    .where(and(eq(tenantMembershipTable.tenant_id, tenantId), eq(tenantMembershipTable.user_id, userId)));

  if (!m || !m.is_active) throw new Error("Membership inválida o inactiva.");
  return m;
}

export async function getMyUser(tenantId: number, userId: number) {
  const membership = await assertActiveMembership(tenantId, userId);

  const [user] = await db
    .select({
      user_id: userTable.user_id,
      email: userTable.email,
      role: userTable.role,
      is_active: userTable.is_active,
      created_at: userTable.created_at,
      last_login: userTable.last_login,
    })
    .from(userTable)
    .where(eq(userTable.user_id, userId));

  if (!user) return null;

  const [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.user_id, userId));

  return {
    user,
    userSettings: settings ?? null,
    roleInTenant: membership.role,
    tenant_id: tenantId,
  };
}

export type UserSettingsUpsert = Partial<{
  display_name: string | null;
  phone: string | null;
  email_notifications: boolean;
}>;

export async function upsertMyUserSettings(tenantId: number, userId: number, patch: UserSettingsUpsert) {
  await assertActiveMembership(tenantId, userId);

  const now = new Date();

  const [row] = await db
    .insert(userSettingsTable)
    .values({
      user_id: userId,
      ...patch,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: userSettingsTable.user_id,
      set: { ...patch, updated_at: now },
    })
    .returning();

  return row;
}

export async function deactivateMyUser(tenantId: number, userId: number) {
  await assertActiveMembership(tenantId, userId);

  const [u] = await db
    .update(userTable)
    .set({ is_active: false })
    .where(eq(userTable.user_id, userId))
    .returning({ user_id: userTable.user_id });

  // revoca sesiones SOLO para este tenant
  await db
    .update(sessionTable)
    .set({ revoked_at: new Date() })
    .where(and(eq(sessionTable.user_id, userId), eq(sessionTable.tenant_id, tenantId)));

  return Boolean(u);
}
