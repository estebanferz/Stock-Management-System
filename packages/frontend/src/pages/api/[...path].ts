import type { APIRoute } from "astro";

export const prerender = false;

export const ALL: APIRoute = async ({ request, params }) => {
  const backendBase = process.env.SERVER_API_URL;
  if (!backendBase) {
    return new Response("Missing SERVER_API_URL", { status: 500 });
  }

  const incoming = new URL(request.url);
  const path =
    typeof (params as any).path === "string"
      ? (params as any).path
      : Array.isArray((params as any).path)
      ? (params as any).path.join("/")
      : "";

  // 🔑 Backend YA vive en /api
  const target = `${backendBase}/${path}${incoming.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const res = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer(),
  });

  const responseHeaders = new Headers(res.headers);

  // ❌ headers que NO deben forwardearse
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");

  // opcional pero sano
  responseHeaders.delete("connection");

  return new Response(res.body, {
    status: res.status,
    headers: responseHeaders,
  });
};
