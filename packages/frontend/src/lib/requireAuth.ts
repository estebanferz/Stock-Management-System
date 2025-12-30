import { serverApp } from "@/lib/serverAPI";

export async function requireAuth(Astro: any) {
  const cookieHeader = Astro.request.headers.get("cookie") ?? "";

  const res = await serverApp.auth.me.get({
    headers: { cookie: cookieHeader },
  });

  // según tu endpoint, res.data = { ok, user? }
  if (!res.data?.ok) {
    return null;
  }

  return res.data.user;
}
