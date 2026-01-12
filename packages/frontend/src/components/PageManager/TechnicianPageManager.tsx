import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { TechnicianTableManager } from "@/components/TableManager/TechnicianTableManager";
import { type Technician } from "@server/db/schema"
import { technicianStates } from "@/components/Structures/technicianStates";
import ActionPanel from "../ActionPanel";
import { normalizeShortString } from "@/utils/formatters";

type Props = {
initialData: Technician[];
columns: any;
};

type DeletedFilter = "active" | "deleted" | "all";

function buildQuery(filters: {
name: string;
speciality: string;
state: string;
email: string;
phone_number: string;
deleted: DeletedFilter;
}) {
const query: Record<string, any> = {};

if (filters.name.trim()) query.name = normalizeShortString(filters.name);
if (filters.speciality.trim()) query.speciality = filters.speciality.trim();
if (filters.state.trim()) query.state = filters.state.trim();
if (filters.email.trim()) query.email = filters.email.trim();
if (filters.phone_number.trim()) query.phone_number = filters.phone_number.trim();

if (filters.deleted === "active") query.is_deleted = "false";
if (filters.deleted === "deleted") query.is_deleted = "true";

return query;
}

export function TechnicianPageManager({ initialData, columns }: Props) {
const [data, setData] = useState<Technician[]>(initialData);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const [filters, setFilters] = useState({
    name: "",
    speciality: "",
    state: "",
    email: "",
    phone_number: "",
    deleted: "active" as DeletedFilter,
});

const query = useMemo(() => buildQuery(filters), [filters]);

useEffect(() => {
    const t = setTimeout(async () => {
    setLoading(true);
    setError(null);
    try {
        const res = await clientApp.technician.all.get({ query });
        setData(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
        setError(e?.message ?? "Error buscando técnicos");
    } finally {
        setLoading(false);
    }
    }, 350);

    return () => clearTimeout(t);
}, [query]);

function clearFilters() {
    setFilters({
    name: "",
    speciality: "",
    state: "",
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
                placeholder="Especialidad"
                value={filters.speciality}
                onChange={(e) => setFilters((f) => ({ ...f, speciality: e.target.value }))}
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
                value={filters.state}
                onChange={(e) =>
                    setFilters((f) => ({ ...f, state: e.target.value }))
                }
                >
                <option value="">Estado</option>

                {technicianStates.map((s) => (
                    <option key={s.value} value={s.value}>
                    {s.label}
                    </option>
                ))}
            </select>

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

            {/* completamos columnas para mantener la grilla prolija */}
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
            <div className="hidden lg:block" />
            </div>

            {/* Tabla */}
            <div className="my-4">
            <TechnicianTableManager data={data} columns={columns} />
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