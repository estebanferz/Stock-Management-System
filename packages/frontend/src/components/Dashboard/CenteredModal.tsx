import { useEffect, useRef } from "react";

interface CenteredModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string; // ej: max-w-md, max-w-lg
}

export function CenteredModal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-md",
}: CenteredModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  // cerrar al click afuera
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        ref={modalRef}
        className={`bg-white dark:bg-neutral-900 rounded-xl shadow-xl w-full ${maxWidth} p-6 animate-in zoom-in duration-200`}
      >
        {title && (
          <h2 className="text-lg font-semibold mb-4">{title}</h2>
        )}

        {children}
      </div>
    </div>
  );
}
