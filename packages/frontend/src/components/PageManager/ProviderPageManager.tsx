import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { ProviderTableManager } from "@/components/TableManager/ProviderTableManager";
import { type Provider } from "@server/db/schema";

type Props = {
  initialData: Provider[];
  columns: any;
};

type DeletedFilter = "active" | "deleted" | "all";

function buildQuery(filters: {
  name: string;
  email: string;
  phone_number: string;
  address: string;
  deleted: DeletedFilter;
}) {
  const query: Record<string, any> = {};

  if (filters.name.trim()) query.name = filters.name.trim();
  if (filters.email.trim()) query.email = filters.email.trim();
  if (filters.phone_number.trim()) query.phone_number = filters.phone_number.trim();
  if (filters.address.trim()) query.address = filters.address.trim();

  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  // all => no mandamos is_deleted

  return query;
}

export function ProviderPageManager({ initialData, columns }: Props) {
  const [data, setData] = useState<Provider[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    deleted: "active" as DeletedFilter,
  });

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.provider.all.get({ query });
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (e: any) {
        setError(e?.message ?? "Error buscando proveedores");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  function clearFilters() {
    setFilters({
      name: "",
      email: "",
      phone_number: "",
      address: "",
      deleted: "active",
    });
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border bg-white p-4 shadow-lg">
          <div className="flex flex-col gap-3">
            {/* Filtros */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Nombre"
                value={filters.name}
                onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              />

              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Email"
                value={filters.email}
                onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
              />

              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Teléfono"
                value={filters.phone_number}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, phone_number: e.target.value }))
                }
              />

              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Dirección"
                value={filters.address}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, address: e.target.value }))
                }
              />

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
              <ProviderTableManager data={data} columns={columns} />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                {loading ? "Buscando..." : `${data.length} resultado(s)`}
                {error ? <span className="text-red-600">{error}</span> : null}
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
