import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { SellerTableManager } from "@/components/TableManager/SellerTableManager";
import { type Seller } from "@server/db/schema"
import ActionPanel from "../ActionPanel";
import { normalizeShortString } from "@/utils/formatters";

type DeletedFilter = "active" | "deleted" | "all";

type Props = {
  initialData: Seller[];
  columns: any;
};

function buildQuery(filters: {
  name: string;
  hire_date: string;
  pay_date: string;
  age_min: string;
  age_max: string;
  commission_min: string;
  commission_max: string;
  deleted: DeletedFilter;
}) {
  const query: Record<string, any> = {};

  if (filters.name.trim()) query.name = normalizeShortString(filters.name);
  if (filters.hire_date) query.hire_date = filters.hire_date;
  if (filters.pay_date) query.pay_date = filters.pay_date;
  if (filters.age_min) query.age_min = filters.age_min;
  if (filters.age_max) query.age_max = filters.age_max;
  if (filters.commission_min) query.commission_min = filters.commission_min;
  if (filters.commission_max) query.commission_max = filters.commission_max;

  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  // all => no mandamos is_deleted

  return query;
}

export function SellerPageManager({ initialData, columns }: Props) {
  const [data, setData] = useState<Seller[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    name: "",
    hire_date: "",
    pay_date: "",
    age_min: "",
    age_max: "",
    commission_min: "",
    commission_max: "",
    deleted: "active" as DeletedFilter,
  });

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.seller.all.get({ query });
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        setError(e?.message ?? "Error buscando vendedores");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  function clearFilters() {
    setFilters({
      name: "",
      hire_date: "",
      pay_date: "",
      age_min: "",
      age_max: "",
      commission_min: "",
      commission_max: "",
      deleted: "active",
    });
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border bg-white p-4 shadow-lg">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Nombre"
                value={filters.name}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, name: e.target.value }))
                }
              />

              {/* Fecha contratación */}
              <div className="relative group w-full">
                <input
                  type="date"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  value={filters.hire_date}
                  onChange={(e) => setFilters((f) => ({ ...f, hire_date: e.target.value }))}
                />

                <span
                  className="absolute -top-9 left-0 z-50 whitespace-nowrap rounded-md border bg-white px-3 py-1 text-xs font-medium text-black shadow-lg
                            opacity-0 scale-95 transition-all duration-200
                            group-hover:opacity-100 group-hover:scale-100
                            pointer-events-none"
                >
                  Fecha de contratación
                </span>
              </div>

              {/* Fecha cobro */}
              <div className="relative group w-full">
                <input
                  type="date"
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                  value={filters.pay_date}
                  onChange={(e) => setFilters((f) => ({ ...f, pay_date: e.target.value }))}
                />

                <span
                  className="absolute -top-9 left-0 z-50 whitespace-nowrap rounded-md border bg-white px-3 py-1 text-xs font-medium text-black shadow-lg
                            opacity-0 scale-95 transition-all duration-200
                            group-hover:opacity-100 group-hover:scale-100
                            pointer-events-none"
                >
                  Fecha de cobro
                </span>
              </div>

              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Edad mín."
                value={filters.age_min}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, age_min: e.target.value }))
                }
              />

              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Edad máx."
                value={filters.age_max}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, age_max: e.target.value }))
                }
              />

              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Comisión mín. (%)"
                value={filters.commission_min}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, commission_min: e.target.value }))
                }
              />

              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Comisión máx. (%)"
                value={filters.commission_max}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, commission_max: e.target.value }))
                }
              />

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

              {/* completar grilla */}
              <div className="hidden lg:block" />
              <div className="hidden lg:block" />
            </div>

            {/* Tabla */}
            <div className="my-4">
              <SellerTableManager data={data} columns={columns} />
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
