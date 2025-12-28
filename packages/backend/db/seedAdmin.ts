import { db } from "@server/db/db";
import { userTable } from "@server/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

async function main() {
  const email = "admin@local.com";
  const password = "Admin1234!";

  const existing = await db
    .select({ user_id: userTable.user_id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (existing.length) {
    console.log("Admin ya existe:", email);
    return;
  }

  const ROUNDS = 12;
  const password_hash = await hash(password, ROUNDS);

  const [created] = await db
    .insert(userTable)
    .values({
      email,
      password_hash,
      // role/is_active/created_at defaults en DB
    })
    .returning({ user_id: userTable.user_id, email: userTable.email });

  console.log("Admin creado:", created);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
