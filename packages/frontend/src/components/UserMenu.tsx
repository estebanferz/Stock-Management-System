import { useEffect, useRef, useState } from "react";

type Props = {
  email: string;
  settingsHref?: string;
};

export function UserMenu({ email, settingsHref = "/profile" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  // cerrar al click afuera / escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // aunque falle, igual forzamos salida a /login
      if (!res.ok) {
        console.warn("Logout failed:", await res.text());
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      // redirigir siempre (por seguridad UX)
      window.location.href = "/login";
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl text-zinc-500 bg-white px-3 py-2 hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="max-w-[220px] truncate text-xs lg:text-sm font-light text-gray-600">
          {email}
        </span>
        <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" id="Layer_1" data-name="Layer 1" viewBox="0 0 24 24" width="20" height="20">
            <path d="m16,23.314c-1.252.444-2.598.686-4,.686s-2.748-.242-4-.686v-2.314c0-2.206,1.794-4,4-4s4,1.794,4,4v2.314ZM12,7c-1.103,0-2,.897-2,2s.897,2,2,2,2-.897,2-2-.897-2-2-2Zm12,5c0,4.433-2.416,8.311-6,10.389v-1.389c0-3.309-2.691-6-6-6s-6,2.691-6,6v1.389C2.416,20.311,0,16.433,0,12,0,5.383,5.383,0,12,0s12,5.383,12,12Zm-8-3c0-2.206-1.794-4-4-4s-4,1.794-4,4,1.794,4,4,4,4-1.794,4-4Z"/>
        </svg>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path
            d="M5 7l5 6 5-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg"
        >
          <a
            role="menuitem"
            href={settingsHref}
            className="block px-4 py-3 text-xs text-gray-800 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Configuración
          </a>

          <div className="h-px bg-black/10" />

          <button
            role="menuitem"
            type="button"
            onClick={handleLogout}
            className="w-full px-4 py-3 text-left text-xs text-red-600 hover:bg-red-50"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
