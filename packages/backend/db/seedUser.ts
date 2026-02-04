import { db } from "@server/db/db";
import { tenantMembershipTable, tenantTable, userTable } from "@server/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

function firstOrNull<T>(rows: readonly T[]): T | null {
  return rows.length ? rows.at(0) ?? null : null;
}

function mustOne<T>(rows: readonly T[], label: string): T {
  const row = rows.at(0);
  if (!row) throw new Error(`Expected 1 row for ${label}, got 0`);
  return row;
}

async function main() {
  const email = "test_user_2370772342665911556@testuser.com";
  const password = "MPuser1234!";
  const tenantName = "MPUser Workspace";

  const ROUNDS = 12;
  const password_hash = await hash(password, ROUNDS);

  await db.transaction(async (tx) => {
    // 1) Buscar o crear user
    const existingUserRows = await tx
      .select({ user_id: userTable.user_id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    const existingUser = firstOrNull(existingUserRows);

    let userId: number;

    if (existingUser) {
      userId = existingUser.user_id;
      console.log("👤 User ya existe:", email);
    } else {
      const createdUserRows = await tx
        .insert(userTable)
        .values({ email, password_hash })
        .returning({ user_id: userTable.user_id });

      const createdUser = mustOne(createdUserRows, "create user");
      userId = createdUser.user_id;

      console.log("✅ User creado:", email);
    }

    // 2) Si ya tiene membership, no crear tenant
    const existingMembershipRows = await tx
      .select({ membership_id: tenantMembershipTable.membership_id })
      .from(tenantMembershipTable)
      .where(eq(tenantMembershipTable.user_id, userId))
      .limit(1);

    const existingMembership = firstOrNull(existingMembershipRows);

    if (existingMembership) {
      console.log("🏢 User ya tiene tenant. Seed finalizado.");
      return;
    }

    // 3) Crear tenant
    const createdTenantRows = await tx
      .insert(tenantTable)
      .values({ name: tenantName })
      .returning({ tenant_id: tenantTable.tenant_id });

    const createdTenant = mustOne(createdTenantRows, "create tenant");
    const tenantId = createdTenant.tenant_id;

    console.log("🏗️ Tenant creado:", tenantName);

    // 4) Crear membership
    await tx.insert(tenantMembershipTable).values({
      tenant_id: tenantId,
      user_id: userId,
      role: "owner",
    });

    console.log("🔗 Membership creada (owner)");
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
