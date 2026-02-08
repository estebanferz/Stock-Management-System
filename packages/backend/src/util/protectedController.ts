import { type AuthUser, SESSION_COOKIE, type TenantSettings } from "@server/db/types";
import { me } from "@server/src/services/authService";

export type TenantRole = "owner" | "admin" | "staff";

export type ProtectedCtx = {
  user: AuthUser;
  tenantId: number;
  roleInTenant: TenantRole;
  tenantSettings: TenantSettings;
};

function isWhitelistedPath(pathname: string) {
  // soporta apps montadas en /api/*
  return (
    pathname.startsWith("/billing") ||
    pathname.startsWith("/api/billing") ||
    pathname === "/auth/logout" ||
    pathname === "/api/auth/logout" ||
    pathname === "/auth/me" ||
    pathname === "/api/auth/me"
  );
}

function toISO(d: Date | string | null | undefined) {
  if (!d) return null;
  const dd = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(dd.getTime()) ? null : dd.toISOString();
}

function getPathname(ctx: any) {
  if (typeof ctx.path === "string") return ctx.path;
  const url = ctx.request?.url;
  if (typeof url === "string") {
    try {
      return new URL(url).pathname;
    } catch {}
  }
  return "";
}

export function protectedController<TResult>(
  handler: (ctx: ProtectedCtx & any) => Promise<TResult> | TResult
) {
  return async (ctx: any): Promise<TResult> => {
    const raw = ctx.cookie?.[SESSION_COOKIE]?.value;
    const sessionId = typeof raw === "string" ? raw : undefined;

    const result = await me(sessionId);

    if (!result.ok) {
      ctx.set.status = 401;
      return { ok: false, message: "UNAUTHORIZED" } as TResult;
    }

    ctx.user = result.user;
    ctx.tenantId = result.tenant.id;
    ctx.roleInTenant = result.roleInTenant;

    ctx.tenantSettings = (result.tenantSettings ?? {
      display_currency: "ARS",
      subscription_status: "inactive",
      trial_ends_at: null,
    }) as any;

    const pathname = getPathname(ctx);
    const allow = isWhitelistedPath(pathname);

    if (!allow) {
      const now = new Date();

      const status = (ctx.tenantSettings as any)?.subscription_status as
        | "trial"
        | "inactive"
        | "pending"
        | "active"
        | "past_due"
        | "canceled"
        | undefined;

      const trialEndsAtRaw = (ctx.tenantSettings as any)?.trial_ends_at as Date | string | null | undefined;

      let trialValid = false;
      if (status === "trial" && trialEndsAtRaw) {
        const d = new Date(trialEndsAtRaw);
        if (!Number.isNaN(d.getTime()) && d.getTime() > now.getTime()) {
          trialValid = true;
        }
      }

      const isActive = status === "active";

      if (!(isActive || trialValid)) {
        ctx.set.status = 402;
        return {
          ok: false,
          error: "SUBSCRIPTION_REQUIRED",
          subscription_status: status ?? "inactive",
          trial_ends_at: toISO(trialEndsAtRaw),
        } as TResult;
      }
    }

    return handler(ctx);
  };
}
