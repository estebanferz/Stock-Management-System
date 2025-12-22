import type { APIRoute } from "astro";

function normalizePath(pathParam: unknown): string {
  if (typeof pathParam === "string") return pathParam;
  if (Array.isArray(pathParam)) return pathParam.map(String).join("/");
  return "";
}

export const ALL: APIRoute = async ({ request, params }) => {
  const backendBase = process.env.SERVER_API_URL;
  if (!backendBase) {
    return new Response("Missing SERVER_API_URL", { status: 500 });
  }

  const incoming = new URL(request.url);
  const path = normalizePath((params as any).path);

  // backendBase debería terminar en /api
  const base = backendBase.endsWith("/") ? backendBase : `${backendBase}/`;
  const target = new URL(`${path}${incoming.search}`, base);

  const headers = new Headers(request.headers);
  headers.delete("host");

  const method = request.method.toUpperCase();
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  const res = await fetch(target, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
};
