import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { ExpenseTableManager } from "@/components/TableManager/ExpenseTableManager";
import { paymentMethods } from "@/components/Structures/paymentMethods";

type Expense = any;

type Props = {
  initialExpenses: Expense[];
  providers: any[];
  columns: any;
};

type DeletedFilter = "active" | "deleted" | "all";

function buildQuery(filters: {
    date: string;
    category: string;
    payment_method: string;
    provider_id: string;
    amount_min: string;
    amount_max: string;
    deleted: DeletedFilter;
}) {
    const query: Record<string, any> = {};

    if (filters.date) query.date = filters.date;
    if (filters.category.trim()) query.category = filters.category.trim();
    if (filters.payment_method.trim()) query.payment_method = filters.payment_method.trim();
    if (filters.provider_id) query.provider_id = filters.provider_id;
    if (filters.amount_min) query.amount_min = filters.amount_min;
    if (filters.amount_max) query.amount_max = filters.amount_max;
    if (filters.deleted === "active") query.is_deleted = "false";
    if (filters.deleted === "deleted") query.is_deleted = "true";

    return query;
}

export function ExpensesPageManager({
  initialExpenses,
  providers,
  columns,
}: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    date: "",
    category: "",
    payment_method: "",
    provider_id: "",
    amount_min: "",
    amount_max: "",
    deleted: "active" as DeletedFilter,
  });

  const providerById = useMemo(
    () => new Map(providers.map(p => [p.provider_id, p.name])),
    [providers]
  );

  const enrichedExpenses = useMemo(
    () =>
      expenses.map(exp => ({
        ...exp,
        provider_name: providerById.get(exp.provider_id) ?? "—",
      })),
    [expenses, providerById]
  );

  const query = useMemo(() => buildQuery(filters), [filters]);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await clientApp.expense.all.get({ query });
      setExpenses(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

    function clearFilters() {
        setFilters({
            date: "",
            category: "",
            payment_method: "",
            provider_id: "",
            amount_min: "",
            amount_max: "",
            deleted: "active",
        });
    }


  return (
        <div className="w-full">
        {/* Filtros */}
        <div className="mx-auto max-w-6xl rounded-2xl border bg-white p-4 shadow-lg">
            <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
            />

            <input
                placeholder="Categoría"
                value={filters.category}
                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
            />

            <select
            value={filters.payment_method}
            onChange={(e) =>
                setFilters((f) => ({ ...f, payment_method: e.target.value }))
            }
            className="rounded-lg border px-3 py-2 text-sm"
            >
            <option value="">Todos los métodos de pago</option>

            {paymentMethods.map((pm) => (
                <option key={pm.value} value={pm.value}>
                {pm.label}
                </option>
            ))}
            </select>

            <select
                value={filters.provider_id}
                onChange={(e) => setFilters(f => ({ ...f, provider_id: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
            >
                <option value="">Todos los proveedores</option>
                {providers.map(p => (
                <option key={p.provider_id} value={p.provider_id}>
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

            <input
                type="number"
                placeholder="Monto mínimo"
                value={filters.amount_min}
                onChange={(e) => setFilters(f => ({ ...f, amount_min: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
            />

            <input
                type="number"
                placeholder="Monto máximo"
                value={filters.amount_max}
                onChange={(e) => setFilters(f => ({ ...f, amount_max: e.target.value }))}
                className="rounded-lg border px-3 py-2 text-sm"
            />


        </div>
        {/* Tabla */}
        <div className="my-4">
            <ExpenseTableManager data={enrichedExpenses} columns={columns} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
            {loading ? "Buscando..." : `${expenses.length} resultado(s)`}
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
