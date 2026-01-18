import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { normalizeShortString } from "@/utils/formatters";
import ActionPanel from "../ActionPanel";
import { type Accessory } from "@server/db/schema";
// Cambiá esto por tu table manager real:
import { AccessoryTableManager } from "@/components/TableManager/AccessoryTableManager";

type Props = {
  initialData: Accessory[];
  columns: any;
};

type DeletedFilter = "active" | "deleted" | "all";
type GiftFilter = "all" | "true" | "false";

function buildQuery(filters: {
  name: string;
  brand: string;
  category: string;
  color: string;
  deposit: string;
  gift: GiftFilter;
  deleted: DeletedFilter;
}) {
  const query: Record<string, any> = {};

  if (filters.name.trim()) query.name = normalizeShortString(filters.name);
  if (filters.brand.trim()) query.brand = normalizeShortString(filters.brand);
  if (filters.category.trim()) query.category = filters.category.trim();
  if (filters.color.trim()) query.color = normalizeShortString(filters.color);
  if (filters.deposit.trim()) query.deposit = normalizeShortString(filters.deposit);

  if (filters.gift !== "all") query.gift = filters.gift; // "true" | "false"
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";

  return query;
}

export function AccessoriesPageManager({ initialData, columns }: Props) {
  const [data, setData] = useState<Accessory[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    name: "",
    brand: "",
    category: "",
    color: "",
    deposit: "",
    gift: "all" as GiftFilter,
    deleted: "active" as DeletedFilter,
  });

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.accessory.all.get({ query });
        setData(res.data || []);
      } catch (e: any) {
        setError(e?.message ?? "Error buscando accesorios");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  function clearFilters() {
    setFilters({
      name: "",
      brand: "",
      category: "",
      color: "",
      deposit: "",
      gift: "all",
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
              {/* Nombre */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Nombre"
                value={filters.name}
                onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              />

              {/* Marca */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Marca"
                value={filters.brand}
                onChange={(e) => setFilters((f) => ({ ...f, brand: e.target.value }))}
              />

              {/* Categoría */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Categoría"
                value={filters.category}
                onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              />

              {/* Color */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Color"
                value={filters.color}
                onChange={(e) => setFilters((f) => ({ ...f, color: e.target.value }))}
              />

              {/* Depósito */}
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Depósito"
                value={filters.deposit}
                onChange={(e) => setFilters((f) => ({ ...f, deposit: e.target.value }))}
              />

              {/* Regalo (gift) */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.gift}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, gift: e.target.value as GiftFilter }))
                }
              >
                <option value="all">Regalo y no</option>
                <option value="true">Regalo</option>
                <option value="false">No regalo</option>
              </select>

              {/* Eliminados */}
              <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.deleted}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, deleted: e.target.value as DeletedFilter }))
                }
              >
                <option value="active">Activos</option>
                <option value="deleted">Eliminados</option>
                <option value="all">Todos</option>
              </select>
            </div>

            {/* Tabla */}
            <div className="my-4">
              <AccessoryTableManager data={data} columns={columns} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {loading ? "Buscando..." : `${data.length} resultado(s)`}
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
