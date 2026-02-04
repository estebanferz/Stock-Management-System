import { useState } from "react";
import { clientApp } from "@/lib/clientAPI";

export default function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      const { data, error: reqError } = await clientApp.auth.register.post({
        email,
        password,
      });

      if (reqError || !data?.ok) {
        setError((data as any)?.message ?? "No se pudo crear la cuenta");
        setBusy(false);
        return;
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
      />

      <label className="mt-4 block text-sm font-semibold text-zinc-900">Contraseña</label>
      <input
        className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="mínimo 8 caracteres"
        minLength={8}
        required
      />

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
      >
        {busy ? "Creando cuenta..." : "Crear cuenta y empezar"}
      </button>

      <p className="mt-3 text-xs text-zinc-500">
        No pedimos tarjeta durante la prueba.
      </p>
    </form>
  );
}
