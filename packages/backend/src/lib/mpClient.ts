const MP_BASE = "https://api.mercadopago.com";

export function mpHeaders() {
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) throw new Error("MP_ACCESS_TOKEN missing");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function mpGet<T>(path: string): Promise<T> {
  const res = await fetch(`${MP_BASE}${path}`, { headers: mpHeaders() });
  const text = await res.text();
  if (!res.ok) throw new Error(`MP GET ${path} failed: ${res.status} ${text}`);
  return JSON.parse(text) as T;
}

export async function mpPost<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${MP_BASE}${path}`, {
    method: "POST",
    headers: mpHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`MP POST ${path} failed: ${res.status} ${text}`);
  return JSON.parse(text) as T;
}

export async function mpPut<T>(path: string, body: any): Promise<T> {
  const res = await fetch(`${MP_BASE}${path}`, {
    method: "PUT",
    headers: mpHeaders(),
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`MP PUT ${path} failed: ${res.status} ${text}`);
  return JSON.parse(text) as T;
}
