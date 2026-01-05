import { Elysia, t } from "elysia";
import {
  login,
  logout,
  me,
  register,
} from "../services/authService";
import { buildSessionCookie, clearSessionCookie } from "../auth/cookies";
import { SESSION_COOKIE, SESSION_DAYS } from "@server/db/types"

export const authController = new Elysia({ prefix: "/auth" })
    .get("/", () => ({ message: "Auth endpoint" }))
    .post(
    "/register",
    async ({ body, set }) => {
        const result = await register(body.email, body.password);

        if (!result.ok) {
        set.status = result.status;
        return { ok: false, message: result.message };
        }

        set.headers["Set-Cookie"] = buildSessionCookie(
        SESSION_COOKIE,
        result.sessionId!,
        60 * 60 * 24 * SESSION_DAYS
        );

        set.status = 201;
        return { ok: true, user: result.user, tenant: result.tenant, roleInTenant: result.roleInTenant };
    },
    {
        body: t.Object({
        email: t.String({ minLength: 5, maxLength: 255 }),
        password: t.String({ minLength: 8, maxLength: 200 }),
        }),
        detail: {
        summary: "Register a new user (optional)",
        tags: ["auth"],
        },
    }
    )
    .post("/login", async ({ body, set }) => {
        const result = await login(body.email, body.password);

        if (!result.ok) {
            set.status = result.status;
            return { ok: false, message: result.message };
        }

        set.headers["Set-Cookie"] = buildSessionCookie(
            SESSION_COOKIE,
            result.sessionId!,
            60 * 60 * 24 * SESSION_DAYS
        );

        return { ok: true, user: result.user, tenant: result.tenant, roleInTenant: result.roleInTenant };
    },
    {
        body: t.Object({
        email: t.String({ minLength: 5, maxLength: 255 }),
        password: t.String({ minLength: 8, maxLength: 200 }),
        }),
        detail: {
        summary: "Login user",
        tags: ["auth"],
        },
    })
    .post(
    "/logout",
    async ({ set, cookie }) => {
        const raw = cookie[SESSION_COOKIE]?.value;
        const sessionId = typeof raw === "string" ? raw : undefined;

        if (sessionId) {
        try {
            await logout(sessionId);
        } catch {
            //doesnt matter 
        }
        }

        set.headers["Set-Cookie"] = clearSessionCookie(SESSION_COOKIE);

        return { ok: true };
    },
    {
        detail: { summary: "Logout user", tags: ["auth"] },
    })
    .get(
    "/me",
    async ({ set, cookie }) => {
        const rawSession = cookie[SESSION_COOKIE]?.value;
        const sessionId = typeof rawSession === "string" ? rawSession : undefined;

        if (!sessionId) {
        set.status = 401;
        return { ok: false, error: "UNAUTHORIZED" };
        }

        const result = await me(sessionId);

        if (!result.ok) {
            const sessionCookie = cookie[SESSION_COOKIE];

            if (sessionCookie) {
            sessionCookie.remove();
            }

            set.status = result.status;
            return { ok: false, error: "UNAUTHORIZED" };
        }

        return { ok: true, user: result.user, tenant: result.tenant, roleInTenant: result.roleInTenant };
    },
    {
        detail: { summary: "Get current user from session", tags: ["auth"] },
    });
