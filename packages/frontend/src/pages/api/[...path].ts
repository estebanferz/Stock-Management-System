import type { APIRoute } from "astro";

function normalizePath(pathParam: unknown): string {
  if (typeof pathParam === "string") return pathParam;
  if (Array.isArray(pathParam)) return pathParam.map(String).join("/");
  return "";
}

export const ALL: APIRoute = async ({ request, params }) => {
  const backendOrigin = process.env.SERVER_API_ORIGIN;
  if (!backendOrigin) {
    return new Response("Missing SERVER_API_ORIGIN", { status: 500 });
  }

  const incoming = new URL(request.url);
  const path = normalizePath((params as any).path);

  // 🔥 ACA está la clave:
  // Astro recibe /api/expense/all
  // Backend espera /api/expense/all
  // Entonces NO volvemos a agregar /api
  const target = new URL(
    `/api/${path}${incoming.search}`,
    backendOrigin
  );

  const headers = new Headers(request.headers);
  headers.delete("host");

  const method = request.method;
  const body =
    method === "GET" || method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const res = await fetch(target.toString(), {
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
