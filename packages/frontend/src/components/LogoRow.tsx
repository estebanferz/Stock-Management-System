import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  businessName: string;
  logoUrl?: string | null;
  canEdit?: boolean;
  onUpload: (file: File) => Promise<string>;
};

export function LogoRow({ businessName, logoUrl, canEdit = true, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const initials =
    businessName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "🏢";

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-wide text-slate-500">Logo</div>

        <div className="mt-2 flex items-center gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border bg-slate-100">
            {logoUrl ? (
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

          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-900">
              {logoUrl ? "Logo cargado" : "Sin logo"}
            </div>
            <div className="text-xs text-slate-500">PNG/JPG recomendado.</div>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      <Button
        size="sm"
        variant="outline"
        className="hover:text-white hover:bg-mainColor"
        type="button"
        disabled={!canEdit || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Subiendo..." : "Cambiar"}
      </Button>
    </div>
  );
}
