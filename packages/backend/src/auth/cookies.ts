export function buildSessionCookie(name: string, value: string, maxAgeSec: number) {
  return `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; HttpOnly; Secure; SameSite=None`;
}

export function clearSessionCookie(name: string) {
  return `${name}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None`;
}