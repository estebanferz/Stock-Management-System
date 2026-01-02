import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { ClientsTableManager } from "@/components/TableManager/ClientsTableManager";
import { type Client } from "@server/db/schema"
import ActionPanel from "../ActionPanel";

type Props = {
  initialData: Client[];
  columns: any;
};

type DeletedFilter = "active" | "deleted" | "all";

function buildQuery(filters: {
  name: string;
  id_number: string;
  email: string;
  phone_number: string;
  deleted: DeletedFilter;
}) {
  const query: Record<string, any> = {};

  if (filters.name.trim()) query.name = filters.name.trim();
  if (filters.id_number.trim()) query.id_number = filters.id_number.trim();
  if (filters.email.trim()) query.email = filters.email.trim();
  if (filters.phone_number.trim()) query.phone_number = filters.phone_number.trim();

  // tu endpoint solo filtra si is_deleted llega en query (o si otro filtro existe)
  if (filters.deleted === "active") query.is_deleted = false;
  if (filters.deleted === "deleted") query.is_deleted = true;
  // "all" => no mandamos is_deleted (y no debería filtrar por borrado)

  return query;
}

export function ClientsPageManager({ initialData, columns }: Props) {
  const [data, setData] = useState<Client[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    name: "",
    id_number: "",
    email: "",
    phone_number: "",
    deleted: "active" as DeletedFilter, // por defecto “no borrados”, como tu SSR
  });

  const query = useMemo(() => buildQuery(filters), [filters]);

  // debounce simple (evita pegarle al backend en cada tecla)
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.client.all.get({ query });
        setData(res.data || []);
      } catch (e: any) {
        setError(e?.message ?? "Error buscando clientes");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query]);

  function clearFilters() {
    setFilters({
      name: "",
      id_number: "",
      email: "",
      phone_number: "",
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
                onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
              />

              <input
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="DNI (completo)"
                inputMode="numeric"
                value={filters.id_number}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    id_number: e.target.value.replace(/\D/g, ""),
                  }))
                }
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
                onChange={(e) => setFilters((f) => ({ ...f, phone_number: e.target.value }))}
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
              <ClientsTableManager data={data} columns={columns} />
            </div>

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
