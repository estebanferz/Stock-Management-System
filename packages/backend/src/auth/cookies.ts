export function buildSessionCookie(
  name: string,
  value: string,
  maxAgeSeconds: number,
) {
  const isProd = process.env.NODE_ENV === "production";

  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${
    isProd ? "; Secure" : ""
  }`;
}

export function clearSessionCookie(name: string) {
  const isProd = process.env.NODE_ENV === "production";

  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    isProd ? "; Secure" : ""
  }`;
}