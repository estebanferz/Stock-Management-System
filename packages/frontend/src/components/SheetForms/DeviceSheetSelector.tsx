import { useEffect, useMemo, useState } from "react";
import { CustomSheet } from "@/components/CustomSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DeviceRow = {
  id: string; // device_id
  title: string;
  imei?: string | null;
  color?: string | null;
  storage?: number | null; // storage_capacity
  battery_health?: number | null;
  subtitle?: string | null;
  price?: string | null;
};

export type DeviceSearchParams = {
  device: string;          // texto (name/brand)
  imei: string;            // exact match
  color: string;           // ilike
  storage_capacity: string; // number string
  battery_min: string;     // number string (interpreta backend como >=)
};

type Props = {
  parentZIndex?: number;
  parentDepth?: number;
  widthPx?: number;
  gapPx?: number;

  currentId?: string;
  onSelect: (id: string, row?: DeviceRow) => void;

  // ✅ búsqueda integrada pero viene como prop
  searchDevices: (params: DeviceSearchParams) => Promise<DeviceRow[]>;

  triggerPlaceholder?: string;
  title?: string;

  // opcional: para no mostrar vendidos
  sold?: "true" | "false";
};

export function DeviceSheetSelector({
  parentZIndex = 100,
  parentDepth = 0,
  widthPx = 420,
  gapPx = 0,
  currentId,
  onSelect,
  searchDevices,
  triggerPlaceholder = "Buscar dispositivo…",
  title = "Seleccionar dispositivo",
  sold = "false",
}: Props) {
  const [open, setOpen] = useState(false);

  // búsqueda: separo “device” e “imei”
  const [device, setDevice] = useState("");
  const [imei, setImei] = useState("");
  const [color, setColor] = useState("any");
  const [storage, setStorage] = useState("any");

  // ✅ batería mínima (>= X)
  const [batteryMin, setBatteryMin] = useState("any");

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<DeviceRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const selectedLabel = useMemo(() => {
    const hit = rows.find((r) => r.id === currentId);
    return hit?.title ?? triggerPlaceholder;
  }, [rows, currentId, triggerPlaceholder]);

  const depth = parentDepth + 1;
  const rightOffset = depth * (widthPx + gapPx);

  useEffect(() => {
    if (!open) return;

    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await searchDevices({
          device,
          imei,
          color,
          storage_capacity: storage,
          battery_min: batteryMin,
          // sold lo manejás en searchDevices (porque es query del backend)
        });

        setRows(res);
      } catch (e: any) {
        setError(e?.message ?? "Error al buscar dispositivos");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [open, device, imei, color, storage, batteryMin, searchDevices]);

  function pick(r: DeviceRow) {
    onSelect(r.id, r);
    setOpen(false);
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between font-normal"
        onClick={() => setOpen(true)}
      >
        <span className="truncate">{selectedLabel}</span>
        <span className="text-xs text-gray-500">Buscar</span>
      </Button>

      <CustomSheet
        title={title}
        description="Buscá por IMEI, color, almacenamiento y batería"
        isOpen={open}
        onOpenChange={setOpen}
        showTrigger={false}
        isModal={true}
        zIndex={parentZIndex + depth * 10}
        isNested={true}
        depth={depth}
        footer={<></>}
      >
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Buscar por nombre/marca</Label>
            <Input
              placeholder="Ej: iPhone 13, Samsung, Moto…"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Buscar por IMEI</Label>
            <Input
              placeholder="IMEI exacto"
              value={imei}
              onChange={(e) => setImei(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label>Color</Label>
              <Input
                placeholder="Ej: azul"
                value={color === "any" ? "" : color}
                onChange={(e) => setColor(e.target.value ? e.target.value : "any")}
              />
            </div>
            <div className="grid gap-2">
              <Label>Storage</Label>
              <Input
                placeholder="Ej: 128"
                value={storage === "any" ? "" : storage}
                onChange={(e) => setStorage(e.target.value ? e.target.value : "any")}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Batería (mínimo)</Label>
            <div className="grid grid-cols-2 gap-2">
              {(["any", "95", "90", "85", "80", "75"] as const).map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={batteryMin === v ? "default" : "outline"}
                  onClick={() => setBatteryMin(v)}
                >
                  {v === "any" ? "Cualquiera" : `≥ ${v}%`}
                </Button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            {loading ? (
              <div className="grid gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-xl border bg-gray-50" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-xl border bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-xl border bg-gray-50 p-3 text-sm text-gray-600">
                No se encontraron dispositivos.
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-1 grid gap-2">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => pick(r)}
                    className="rounded-xl border p-3 text-left hover:bg-gray-50"
                  >
                    <div className="font-semibold text-gray-900 truncate">{r.title}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {r.imei ? `IMEI: ${r.imei}` : "IMEI: —"}
                      {typeof r.battery_health === "number" ? ` · Bat: ${r.battery_health}%` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setDevice("");
              setImei("");
              setColor("any");
              setStorage("any");
              setBatteryMin("any");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </CustomSheet>
    </>
  );
}
