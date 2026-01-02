import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { productTypes } from "@/components/Structures/productTypes";
import { PhoneTableManager } from "@/components/TableManager/PhoneTableManager";
import { type Phone } from "@server/db/schema"
import { phoneCategories } from "@/components/Structures/phoneCategories";
import ActionPanel from "../ActionPanel";

type Props = {
  initialData: Phone[];
  columns: any;
};

type DeletedFilter = "active" | "deleted" | "all";
type SoldFilter = "all" | "sold" | "available";
type TradeInFilter = "all" | "true" | "false";

function buildQuery(filters: {
  device: string;
  imei: string;
  storage_capacity: string;
  battery_health: string; 
  color: string;
  category: string; 
  device_type: string; 
  trade_in: TradeInFilter;
  sold: SoldFilter;
  deleted: DeletedFilter;
}) {
  const query: Record<string, any> = {};

  if (filters.device.trim()) query.device = filters.device.trim();

  // IMEI (exacto)
  if (filters.imei.trim()) query.imei = filters.imei.trim();

  // Storage (exacto)
  const storage = filters.storage_capacity.trim();
  if (storage) query.storage_capacity = storage;

  // Battery health (mínimo)
  const battery = filters.battery_health.trim();
  if (battery) query.battery_health = battery;

  // Color (parcial)
  if (filters.color.trim()) query.color = filters.color.trim();

  // Categoría (exacto)
  if (filters.category.trim()) query.category = filters.category.trim();

  // Tipo de producto (exacto, viene del select)
  if (filters.device_type.trim()) query.device_type = filters.device_type.trim();

  // Trade-in boolean (string)
  if (filters.trade_in !== "all") query.trade_in = filters.trade_in;

  // Sold boolean (string)
  if (filters.sold === "sold") query.sold = "true";
  if (filters.sold === "available") query.sold = "false";

  // Is_deleted boolean (string) — importante por tu endpoint
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";

  return query;
}

export function PhonesPageManager({ initialData, columns }: Props) {
  const [data, setData] = useState<Phone[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.phone.all.get({ query });
        setData(res.data || []);
      } catch (e: any) {
        setError(e?.message ?? "Error buscando dispositivos");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  function clearFilters() {
    setFilters({
      device: "",
      imei: "",
      storage_capacity: "",
      battery_health: "",
      color: "",
      category: "",
      device_type: "",
      trade_in: "all",
      sold: "all",
      deleted: "active",
    });
  }

  return (
    <div className="w-full">
      {/* Buscador */}
      <div className="mx-auto max-w-6xl">
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

              {/* IMEI */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="IMEI (exacto)"
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

              {/* Battery health */}
              <input
                type="number"
                inputMode="numeric"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Batería ≥ %"
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

              {/* Tipo (device_type) */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.device_type}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, device_type: e.target.value }))
                }
              >
                <option value="">Todos los tipos</option>
                {productTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
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
              <PhoneTableManager data={data} columns={columns} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {loading ? "Buscando..." : `${data.length} resultado(s)`}
                {error ? <span className="text-red-600">{error}</span> : null}
              </div>
              
              <div className="md:hidden">
                <ActionPanel/>
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
