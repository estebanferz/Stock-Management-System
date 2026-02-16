import { useMemo, useState, useEffect } from "react";
import { clientApp } from "@/lib/clientAPI";
import { motion, AnimatePresence } from "framer-motion";


function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (!/[0-9]/.test(pw)) return "La contraseña debe incluir al menos un número.";
  if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]\\/~`+=;]/.test(pw))
    return "La contraseña debe incluir al menos un signo especial.";
  return null;
}


type Currency = "ARS" | "USD" | "EUR" | "BRL";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [currency, setCurrency] = useState<Currency>("ARS");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const isPasswordValid = useMemo(() => {
    if (!password) return false;
    return validatePassword(password) === null;
  }, [password]);

  const canSubmit = useMemo(() => {
    if (!email || !password || !!passwordError) return false;
    if (!isPasswordValid) return false; // si querés obligar el paso 2 cuando se muestra
    if (!userName.trim() || !tenantName.trim()) return false;
    return true;
  }, [email, password, passwordError, isPasswordValid, userName, tenantName]);

  const businessName = tenantName || "Empresa";

  const initials = useMemo(() => {
    const parts = businessName.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "E";
    const b = parts.length > 1 ? parts[1]?.[0] : (parts[0]?.[1] ?? "");
    return (a + b).toUpperCase();
  }, [businessName]);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoUrl(null);
      return;
    }

    const url = URL.createObjectURL(logoFile);
    setLogoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const pwErr = validatePassword(password);
    if (pwErr) {
      setError(pwErr);
      return;
    }

    if (isPasswordValid) {
      if (!userName.trim()) return setError("Completá tu nombre de usuario.");
      if (!tenantName.trim()) return setError("Completá el nombre de tu empresa (tenant).");
      if (!currency) return setError("Elegí una moneda.");
    }

    setBusy(true);

    try {
      const { data, error: reqError } = await clientApp.auth.register.post({
        email,
        password,
        userName,
        tenantName,
        currency,
      });

      if (reqError || !data?.ok) {
        setError((data as any)?.message ?? "No se pudo crear la cuenta");
        setBusy(false);
        return;
      }

      if (logoFile) {
        const pres = await clientApp.tenant.logo.presign.post({
          contentType: logoFile.type,
          filename: logoFile.name,
          size: logoFile.size,
        });

        if (pres.error || !pres.data?.ok) {
          setError((pres.data as any)?.message ?? "No se pudo preparar la subida del logo");
          setBusy(false);
          return;
        }

        // ✅ Guard para TS: aseguramos que existen
        const putUrl = (pres.data as any).putUrl as string | undefined;
        const key = (pres.data as any).key as string | undefined;

        if (!putUrl || !key) {
          setError("Respuesta inválida del servidor (putUrl/key faltantes).");
          setBusy(false);
          return;
        }

        const putRes = await fetch(putUrl, {
          method: "PUT",
          headers: { "Content-Type": logoFile.type },
          body: logoFile,
        });

        if (!putRes.ok) {
          setError("Falló la subida del logo.");
          setBusy(false);
          return;
        }

        const link = await clientApp.tenant.logo.link.post({
          key,
          contentType: logoFile.type,
        });

        if (link.error || !link.data?.ok) {
          setError((link.data as any)?.message ?? "No se pudo vincular el logo.");
          setBusy(false);
          return;
        }
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Error de red. Probá de nuevo.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
      <label className="block text-sm font-semibold text-zinc-900">Email</label>
      <input
        className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        required
        autoComplete="email"
      />

      <label className="mt-4 block text-sm font-semibold text-zinc-900">Contraseña</label>
      <input
        className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 
          ${passwordError ? "border-red-500" : "border-zinc-200"} 
          bg-white focus:ring-zinc-900/10`}
        type="password"
        value={password}
        onChange={(e) => {
          const value = e.target.value;
          setPassword(value);
          setPasswordError(validatePassword(value));
        }}
        placeholder="mínimo 8 caracteres, 1 número y 1 símbolo"
        required
        autoComplete="new-password"
      />
      {passwordError && <p className="mt-2 text-xs text-red-600">{passwordError}</p>}

      <AnimatePresence>
        {isPasswordValid && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-4 rounded-2xl py-4">
              <div>
                  <label className="block text-sm font-semibold text-zinc-900">Tu nombre de usuario</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Ej: Tomás"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900">Nombre de la empresa</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Ej: Zuma+ Repairs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900">Moneda principal</label>
                  <select
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                    required
                  >
                    <option value="ARS">ARS</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="BRL">BRL</option>
                  </select>
                  <p className="mt-2 text-xs text-zinc-500">
                    Esta moneda se usa para mostrar métricas y totales en el dashboard.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-zinc-900">Logo (opcional)</label>

                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-slate-100">
                      {logoFile && logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`Logo de ${businessName}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-700">
                          {initials}
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <input
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                      />

                      {logoFile ? (
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <p className="text-xs text-zinc-600 truncate">Archivo seleccionado: {logoFile.name}</p>
                          <button
                            type="button"
                            onClick={() => setLogoFile(null)}
                            className="text-xs font-semibold text-zinc-900 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-zinc-500">PNG/JPG/WebP. Recomendado: cuadrado (1:1).</p>
                      )}
                    </div>
                  </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={busy || !canSubmit}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
      >
        {busy ? "Creando cuenta..." : "Crear cuenta y empezar"}
      </button>

      <p className="mt-3 text-xs text-zinc-500">No pedimos tarjeta durante la prueba.</p>
    </form>
  );
}
