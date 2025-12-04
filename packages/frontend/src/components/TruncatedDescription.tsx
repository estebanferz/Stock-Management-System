import { useState, useRef, useEffect } from "react";

interface TruncatedDescriptionProps {
  text: string;
  words?: number;
}

export function TruncatedDescription({ text, words = 2 }: TruncatedDescriptionProps) {
  const [open, setOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Cerrar el popup al hacer click afuera
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Texto truncado
  const preview =
    text.split(" ").slice(0, words).join(" ") +
    (text.split(" ").length > words ? "..." : "");

  return (
    <>
      {/* Texto truncado clickeable */}
      <div
        className="flex items-center gap-1 cursor-pointer text-muted-foreground hover:text-foreground transition"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{preview}</span>

        {/* Icono indicador */}
        <span className="text-xs opacity-70">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="16"
            height="16"
          >
            <path d="m12,16.074c-.4,0-.777-.156-1.061-.439l-5.281-5.281.707-.707,5.281,5.281c.189.189.518.189.707,0l5.281-5.281.707.707-5.281,5.281c-.283.283-.66.439-1.061.439Z" />
          </svg>
        </span>
      </div>

      {/* Popup + Overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          
          {/* Contenedor del popup */}
          <div
            ref={modalRef}
            className="bg-white dark:bg-neutral-900 p-6 rounded-xl shadow-xl max-w-md w-full animate-in zoom-in duration-200"
          >
            <h2 className="text-lg font-semibold mb-3">Descripción completa</h2>

            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {text}
            </p>

            <button
              onClick={() => setOpen(false)}
              className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 w-full transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
