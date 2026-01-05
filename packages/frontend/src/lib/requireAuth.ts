import { serverApp } from "@/lib/serverAPI";
import type { AuthMe } from "@server/db/types";

export type RequireAuthResult = {
  auth: AuthMe;
  cookieHeader: string;
};

export async function requireAuth(Astro: any): Promise<RequireAuthResult | null> {
  const cookieHeader = Astro.request.headers.get("cookie") ?? "";

  const res = await serverApp.auth.me.get({
    headers: { cookie: cookieHeader },
  });

  if (!res.data?.ok) return null;

  const data = res.data as any;

  const auth: AuthMe = {
    user: data.user,
    tenant: data.tenant,
    roleInTenant: data.roleInTenant,
    tenantSettings: data.tenantSettings ?? data.tenant_settings ?? null,
  };

  return { auth, cookieHeader };
}
