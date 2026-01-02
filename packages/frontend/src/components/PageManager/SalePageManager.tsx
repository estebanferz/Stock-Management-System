import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { SaleTableManager } from "@/components/TableManager/SaleTableManager";
import { type Sale } from "@server/db/schema";

type DeletedFilter = "active" | "deleted" | "all";

type Props = {
  initialSales: Sale[];
  clients: any[];
  sellers: any[];
  phones: any[];
  columns: any;
};

function buildQuery(filters: {
  date: string;
  client_id: string;
  seller_id: string;
  device_id: string;
  deleted: DeletedFilter;
}) {
  const query: Record<string, any> = {};

  if (filters.date) query.date = filters.date;
  if (filters.client_id) query.client_id = filters.client_id;
  if (filters.seller_id) query.seller_id = filters.seller_id;
  if (filters.device_id) query.device_id = filters.device_id;
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";

  return query;
}

export function SalesPageManager({
  initialSales,
  clients,
  sellers,
  phones,
  columns,
}: Props) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const [filters, setFilters] = useState({
    date: "",
    client_id: "",
    seller_id: "",
    device_id: "",
    deleted: "active" as DeletedFilter,
  });

  // Mapas id → label
  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.client_id, c.name])),
    [clients]
  );

  const sellerById = useMemo(
    () => new Map(sellers.map((s) => [s.seller_id, s.name])),
    [sellers]
  );

  const phoneById = useMemo(
    () => new Map(phones.map((p) => [p.device_id, p.name])),
    [phones]
  );

  const enrichedSales = useMemo(
    () =>
      sales.map((sale) => ({
        ...sale,
        client_name: clientById.get(sale.client_id) ?? "—",
        seller_name: sellerById.get(sale.seller_id) ?? "—",
        device_name: phoneById.get(sale.device_id) ?? "—",
      })),
    [sales, clientById, sellerById, phoneById]
  );

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await clientApp.sale.all.get({ query });
      setSales(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  function clearFilters() {
    setFilters({
      date: "",
      client_id: "",
      seller_id: "",
      device_id: "",
      deleted: "active",
    });
  }

  return (
    <div className="w-full">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-white p-4 shadow-lg">
        <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-5">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          />

          <select
            value={filters.client_id}
            onChange={(e) => setFilters(f => ({ ...f, client_id: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Clientes</option>
            {clients.map(c => (
              <option key={c.client_id} value={c.client_id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filters.seller_id}
            onChange={(e) => setFilters(f => ({ ...f, seller_id: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Vendedores</option>
            {sellers.map(s => (
              <option key={s.seller_id} value={s.seller_id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={filters.device_id}
            onChange={(e) => setFilters(f => ({ ...f, device_id: e.target.value }))}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Dispositivos</option>
            {phones.map(p => (
              <option key={p.device_id} value={p.device_id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={filters.deleted}
            onChange={(e) =>
              setFilters((f) => ({ ...f, deleted: e.target.value as DeletedFilter }))
            }
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="active">Activos</option>
            <option value="deleted">Eliminados</option>
            <option value="all">Todos</option>
        </select>

        </div>

          {/* Tabla */}
          <div className="my-4">
            <SaleTableManager data={enrichedSales} columns={columns} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
            {loading ? "Buscando..." : `${sales.length} resultado(s)`}
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
  );
}
