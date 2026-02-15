import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { productTypes } from "@/components/Structures/productTypes";
import { PhoneTableManager } from "@/components/TableManager/PhoneTableManager";
import { type Phone } from "@server/db/schema";
import { phoneCategories } from "@/components/Structures/phoneCategories";
import ActionPanel from "../ActionPanel";
import { normalizeShortString } from "@/utils/formatters";
import { Smartphone, Tablet, Laptop, Watch, type LucideIcon } from "lucide-react";

type Props = {
  initialData: Phone[];
  phoneColumns: any;
  computerColumns: any;
  tabletColumns: any;
  watchColumns: any;
  headphoneColumns: any;
};

type DeletedFilter = "active" | "deleted" | "all";
type SoldFilter = "all" | "sold" | "available";
type TradeInFilter = "all" | "true" | "false";

type DeviceTab = "phones" | "tablets" | "computers" | "watches";


function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (v === null || v === undefined) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1" || s === "t" || s === "yes";
}

export function PhonesPageManager({
  initialData,
  phoneColumns,
  computerColumns,
  tabletColumns,
  watchColumns,
  headphoneColumns,
}: Props) {
  const [selected, setSelected] = useState<DeviceTab>("phones");

  const [allData, setAllData] = useState<Phone[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log("total", allData.length);
console.log("deleted count", allData.filter(d => toBool((d as any).is_deleted)).length);

  const [filters, setFilters] = useState({
    device: "",
    imei: "",
    storage_capacity: "",
    battery_health: "",
    color: "",
    category: "",
    device_type: "",
    trade_in: "all" as TradeInFilter,
    sold: "all" as SoldFilter,
    deleted: "active" as DeletedFilter,
  });

  const filteredData = useMemo(() => {
  const f = filters;

  return allData.filter((row: any) => {
    // Marca / Modelo (contains)
    if (f.device.trim()) {
      const needle = normalizeShortString(f.device);

      const brand = normalizeShortString(String((row as any).brand ?? ""));
      const name = normalizeShortString(String((row as any).name ?? ""));

      const haystack = `${brand} ${name}`.trim();

      if (!haystack.includes(needle)) return false;
    }

    // IMEI / Serie (exacto)
    if (f.imei.trim()) {
      const v = String(row.imei ?? "").trim();
      if (v !== f.imei.trim()) return false;
    }

    // Storage (exacto)
    if (f.storage_capacity.trim()) {
      const n = Number(f.storage_capacity);
      if (Number(row.storage_capacity ?? 0) !== n) return false;
    }

    // Battery >= (o ciclos, mismo campo)
    if (f.battery_health.trim()) {
      const min = Number(f.battery_health);
      if (Number(row.battery_health ?? 0) < min) return false;
    }

    // Color (contains)
    if (f.color.trim()) {
      const needle = normalizeShortString(f.color);
      const hay = normalizeShortString(String(row.color ?? ""));
      if (!hay.includes(needle)) return false;
    }

    // Categoría (exacto)
    if (f.category.trim()) {
      if (String(row.category ?? "") !== f.category.trim()) return false;
    }

    // Tipo (exacto)
    if (f.device_type.trim()) {
      if (String(row.device_type ?? "") !== f.device_type.trim()) return false;
    }

    // Trade-in
    if (f.trade_in !== "all") {
      if (String(row.trade_in) !== f.trade_in) return false;
    }

    // Vendidos
    if (f.sold !== "all") {
      const wantSold = f.sold === "sold";
      const rowSold = toBool(row.sold);
      if (rowSold !== wantSold) return false;
    }

    // Eliminados
    if (f.deleted !== "all") {
      const wantDeleted = f.deleted === "deleted";
      const rowDeleted = toBool(row.is_deleted);
      if (rowDeleted !== wantDeleted) return false;
    }

    return true;
  });
}, [allData, filters]);

console.log("total", allData.length);
console.log("deleted count", allData.filter(d => toBool((d as any).is_deleted)).length);

  const columns = useMemo(() => {
    switch (selected) {
      case "phones":
        return phoneColumns;
      case "tablets":
        return tabletColumns;
      case "computers":
        return computerColumns;
      case "watches":
        return watchColumns;
      default:
        return phoneColumns;
    }
  }, [selected, phoneColumns, tabletColumns, watchColumns, headphoneColumns]);

  const serialLabel = useMemo(() => {
    return selected === "phones" ? "IMEI" : "Nro Serie";
  }, [selected]);

  const batteryLabel = useMemo(() => {
    return selected === "computers" ? "Ciclos" : "Batería";
  }, [selected]);

  useEffect(() => {
    const map: Record<DeviceTab, string> = {
      phones: "phone",
      tablets: "tablet",
      computers: "computer",
      watches: "watch",
    };

    setFilters((f) => ({ ...f, device_type: map[selected] ?? "" }));
  }, [selected]);


  function clearFilters() {
    setFilters((f) => ({
      ...f,
      device: "",
      imei: "",
      storage_capacity: "",
      battery_health: "",
      color: "",
      category: "",
      trade_in: "all",
      sold: "all",
      deleted: "active",
    }));
  }

  const tabs: { key: DeviceTab; label: string; icon: LucideIcon }[] = [
    { key: "phones", label: "Celulares", icon: Smartphone },
    { key: "computers", label: "Computadoras", icon: Laptop },
    { key: "tablets", label: "Tablets", icon: Tablet },
    { key: "watches", label: "Relojes", icon: Watch },
  ];

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-4 gap-3 my-5">
          {tabs.map((t) => {
            const active = selected === t.key;
            const Icon = t.icon;

            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelected(t.key)}
                className={[
                  "rounded-lg py-6 px-6 text-sm font-medium transition shadow-md flex items-center justify-center gap-2",
                  active
                    ? "bg-secondColor text-white border-0"
                    : "bg-white border-2 text-gray-700 hover:border-0 hover:bg-mainColor/10",
                ].join(" ")}
              >
                <Icon size={22} />
                <span className="hidden lg:block truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="rounded-2xl border bg-white p-4 shadow-lg">
          <div className="flex flex-col gap-3">


            {/* Filtros */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              {/* Marca / Modelo */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Marca / Modelo"
                value={filters.device}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, device: e.target.value }))
                }
              />

              {/* IMEI / Serie */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder={`${serialLabel} (exacto)`}
                value={filters.imei}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, imei: e.target.value }))
                }
              />

              {/* Storage */}
              <input
                type="number"
                inputMode="numeric"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Almacenamiento (GB)"
                value={filters.storage_capacity}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    storage_capacity: e.target.value,
                  }))
                }
              />

              {/* Battery health / cycles */}
              <input
                type="number"
                inputMode="numeric"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder={`${batteryLabel} ≥`}
                value={filters.battery_health}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    battery_health: e.target.value,
                  }))
                }
              />

              {/* Color */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Color"
                value={filters.color}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, color: e.target.value }))
                }
              />

              {/* Categoría */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.category}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, category: e.target.value }))
                }
              >
                <option value="">Todas las categorías</option>
                {phoneCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              {/* Trade-in */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.trade_in}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    trade_in: e.target.value as TradeInFilter,
                  }))
                }
              >
                <option value="all">Trade-in y no</option>
                <option value="true">Trade-in</option>
                <option value="false">No Trade-in</option>
              </select>

              {/* Vendidos */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.sold}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    sold: e.target.value as SoldFilter,
                  }))
                }
              >
                <option value="available">Disponibles</option>
                <option value="sold">Vendidos</option>
                <option value="all">Vendidos y disponibles</option>
              </select>

              {/* Eliminados */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.deleted}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    deleted: e.target.value as DeletedFilter,
                  }))
                }
              >
                <option value="active">Activos</option>
                <option value="deleted">Eliminados</option>
                <option value="all">Todos</option>
              </select>
            </div>

            {/* Tabla */}
            <div className="my-4">
              <PhoneTableManager data={filteredData} columns={columns} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {loading ? "Buscando..." : `${filteredData.length} resultado(s)`}
                {error ? <span className="text-red-600">{error}</span> : null}
              </div>

              <div className="md:hidden">
                <ActionPanel />
              </div>

              <button
                className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                onClick={clearFilters}
                type="button"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
