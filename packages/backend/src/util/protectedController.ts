import { type AuthUser, SESSION_COOKIE } from "@server/db/types";
import { me } from "@server/src/services/authService";

export function protectedController<TResult>(
  handler: (ctx: { user: AuthUser } & any) => Promise<TResult> | TResult
) {
  return async (ctx: any): Promise<TResult> => {
    const raw = ctx.cookie?.[SESSION_COOKIE]?.value;
    const sessionId = typeof raw === "string" ? raw : undefined;

    const result = await me(sessionId);

    if (!result.ok) {
      ctx.set.status = 401;
      return { ok: false, message: "UNAUTHORIZED" } as TResult;
    }

    ctx.user = result.user; // 👈 inyección controlada
    return handler(ctx);
  };
}
