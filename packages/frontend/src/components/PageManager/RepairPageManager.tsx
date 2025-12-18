import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { RepairTableManager } from "@/components/TableManager/RepairTableManager";
import { priorities } from "@/components/Structures/priorities";
import { type Repair } from "@server/db/schema";
import { repairStates } from "../Structures/repairStates";


type DeletedFilter = "active" | "deleted" | "all";

type Props = {
initialRepairs: Repair[];
columns: any;
clients: any[];
technicians: any[];
phones: any[];
};

function buildQuery(filters: {
date: string;
repair_state: string;
priority: string;
client_id: string;
technician_id: string;
device_id: string;
cost_min: string;
cost_max: string;
deleted: DeletedFilter;
}) {
const query: Record<string, any> = {};

if (filters.date) query.date = filters.date;
if (filters.repair_state) query.repair_state = filters.repair_state;
if (filters.priority) query.priority = filters.priority;
if (filters.client_id) query.client_id = filters.client_id;
if (filters.technician_id) query.technician_id = filters.technician_id;
if (filters.device_id) query.device_id = filters.device_id;
if (filters.cost_min) query.cost_min = filters.cost_min;
if (filters.cost_max) query.cost_max = filters.cost_max;

if (filters.deleted === "active") query.is_deleted = "false";
if (filters.deleted === "deleted") query.is_deleted = "true";

return query;
}

export function RepairPageManager({
initialRepairs,
columns,
clients,
technicians,
phones,
}: Props) {
const [repairs, setRepairs] = useState<Repair[]>(initialRepairs);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const [filters, setFilters] = useState({
    date: "",
    repair_state: "",
    priority: "",
    client_id: "",
    technician_id: "",
    device_id: "",
    cost_min: "",
    cost_max: "",
    deleted: "active" as DeletedFilter,
});

const query = useMemo(() => buildQuery(filters), [filters]);

// Enriquecimiento (nombres)
const clientById = useMemo(
    () => new Map(clients.map((c) => [c.client_id, c.name])),
    [clients]
);

const technicianById = useMemo(
    () => new Map(technicians.map((t) => [t.technician_id, t.name])),
    [technicians]
);

const phoneById = useMemo(
    () => new Map(phones.map((p) => [p.device_id, p.name])),
    [phones]
);

const data = useMemo(
    () =>
    repairs.map((r) => ({
        ...r,
        client_name: clientById.get(r.client_id) ?? "—",
        technician_name: technicianById.get(r.technician_id) ?? "—",
        device_name: phoneById.get(r.device_id) ?? "—",
    })),
    [repairs, clientById, technicianById, phoneById]
);

useEffect(() => {
    const t = setTimeout(async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await clientApp.repair.all.get({ query });
        setRepairs(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
        setError(e?.message ?? "Error buscando reparaciones");
    } finally {
        setLoading(false);
    }
    }, 350);

    return () => clearTimeout(t);
}, [query]);

function clearFilters() {
    setFilters({
    date: "",
    repair_state: "",
    priority: "",
    client_id: "",
    technician_id: "",
    device_id: "",
    cost_min: "",
    cost_max: "",
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
                type="date"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.date}
                onChange={(e) => setFilters(f => ({ ...f, date: e.target.value }))}
            />

            <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.repair_state}
                onChange={(e) =>
                    setFilters((f) => ({ ...f, repair_state: e.target.value }))
                }
                >
                <option value="">Estado</option>

                {repairStates.map((p) => (
                    <option key={p.value} value={p.value}>
                    {p.label}
                    </option>
                ))}
            </select>

            <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            value={filters.priority}
            onChange={(e) =>
                setFilters((f) => ({ ...f, priority: e.target.value }))
            }
            >
            <option value="">Prioridad</option>

            {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                {p.label}
                </option>
            ))}
            </select>

            <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.client_id}
                onChange={(e) => setFilters(f => ({ ...f, client_id: e.target.value }))}
            >
                <option value="">Todos los clientes</option>
                {clients.map((c) => (
                <option key={c.client_id} value={c.client_id}>{c.name}</option>
                ))}
            </select>

            <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.technician_id}
                onChange={(e) => setFilters(f => ({ ...f, technician_id: e.target.value }))}
            >
                <option value="">Todos los técnicos</option>
                {technicians.map((t) => (
                <option key={t.technician_id} value={t.technician_id}>{t.name}</option>
                ))}
            </select>

            <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.device_id}
                onChange={(e) => setFilters(f => ({ ...f, device_id: e.target.value }))}
            >
                <option value="">Todos los dispositivos</option>
                {phones.map((p) => (
                <option key={p.device_id} value={p.device_id}>{p.name}</option>
                ))}
            </select>

            <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Costo mín."
                value={filters.cost_min}
                onChange={(e) => setFilters(f => ({ ...f, cost_min: e.target.value }))}
            />

            <input
                type="number"
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                placeholder="Costo máx."
                value={filters.cost_max}
                onChange={(e) => setFilters(f => ({ ...f, cost_max: e.target.value }))}
            />

            <select
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
                value={filters.deleted}
                onChange={(e) =>
                setFilters(f => ({ ...f, deleted: e.target.value as DeletedFilter }))
                }
            >
                <option value="active">Activas</option>
                <option value="deleted">Eliminadas</option>
                <option value="all">Todas</option>
            </select>
            </div>

            {/* Tabla */}
            <div className="my-4">
            <RepairTableManager data={data} columns={columns} />
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
