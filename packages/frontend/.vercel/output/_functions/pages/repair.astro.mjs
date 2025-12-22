/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { C as CustomSheet, L as Label, I as Input, B as Button, S as SheetClose, T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { S as SheetSelector, D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from '../chunks/dropdown-menu_p3DDvNeO.mjs';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

const repairStates = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en-reparacion", label: "En reparación" },
  { value: "listo", label: "Listo" },
  { value: "entregado", label: "Entregado" }
];

const priorities = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" }
];

const getLocalTime = () => {
  const today = /* @__PURE__ */ new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 6e4);
};
function SheetFormRepair() {
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16));
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState(null);
  const [form, setForm] = useState({
    datetime: "",
    repair_state: "Estado",
    priority: "",
    description: "",
    diagnostic: "",
    client_cost: "",
    internal_cost: "",
    client_id: "",
    technician_id: "",
    device_id: ""
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingRepair(row);
      const iso = row.datetime instanceof Date ? row.datetime.toISOString() : String(row.datetime);
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));
      setForm({
        datetime: row.datetime ? String(row.datetime) : "",
        repair_state: row.repair_state ?? "",
        priority: row.priority ?? "",
        description: row.description ?? "",
        diagnostic: row.diagnostic ?? "",
        client_cost: row.client_cost ?? "",
        internal_cost: row.internal_cost ?? "",
        client_id: row.client_id ? row.client_id.toString() : "",
        technician_id: row.technician_id ? row.technician_id.toString() : "",
        device_id: row.device_id ? row.device_id.toString() : ""
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-repair", onEdit);
    return () => window.removeEventListener("open-edit-repair", onEdit);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const datetime = `${date}T${time}:00Z`;
    const repairData = {
      ...form,
      datetime,
      client_id: Number(form.client_id),
      technician_id: Number(form.technician_id),
      device_id: Number(form.device_id)
    };
    try {
      let response;
      const isEditing = !!editingRepair;
      if (isEditing) {
        response = await clientApp.repair({ id: editingRepair.repair_id }).put(repairData);
      } else {
        response = await clientApp.repair.post(repairData);
      }
      const { data, error } = response;
      if (error) throw error.value;
      window.location.reload();
    } catch (err) {
      console.error("❌ Error al cargar reparación:", err);
      alert("Error al cargar reparación");
    }
  };
  return /* @__PURE__ */ jsx("form", { id: "form-sale", onSubmit: handleSubmit, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      title: "Agregar Reparación",
      zIndex: 60,
      isOpen: internalOpen,
      onOpenChange: setInternalOpen,
      description: "Agregar reparación de dispositivo al sistema",
      isModal: true,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-sale", children: "Agregar" }),
        /* @__PURE__ */ jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Cancelar" }) })
      ] }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Fecha y hora" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
            /* @__PURE__ */ jsx(Input, { type: "date", value: date, onChange: (e) => setDate(e.target.value) }),
            /* @__PURE__ */ jsx(Input, { type: "time", value: time, onChange: (e) => setTime(e.target.value) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Dispositivo" }),
          /* @__PURE__ */ jsx(SheetSelector, { type: "device", currentId: form.device_id, onSelect: (id) => setForm({ ...form, device_id: id }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Cliente" }),
          /* @__PURE__ */ jsx(SheetSelector, { type: "client", currentId: form.client_id, onSelect: (id) => setForm({ ...form, client_id: id }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Tecnico" }),
          /* @__PURE__ */ jsx(SheetSelector, { type: "technician", currentId: form.technician_id, onSelect: (id) => setForm({ ...form, technician_id: id }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Estado de reparación" }),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto w-full justify-between font-normal", children: [
              form.repair_state,
              " ",
              /* @__PURE__ */ jsx(ChevronDown, {})
            ] }) }),
            /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: repairStates.map((method) => /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setForm({ ...form, repair_state: method.value }), children: method.label }, method.value)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Prioridad" }),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto w-full justify-between font-normal", children: [
              form.priority,
              " ",
              /* @__PURE__ */ jsx(ChevronDown, {})
            ] }) }),
            /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: priorities.map((method) => /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setForm({ ...form, priority: method.value }), children: method.label }, method.value)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Descripción" }),
          /* @__PURE__ */ jsx(Input, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Diagnóstico técnico" }),
          /* @__PURE__ */ jsx(Input, { value: form.diagnostic, onChange: (e) => setForm({ ...form, diagnostic: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Costo al cliente" }),
          /* @__PURE__ */ jsx(Input, { type: "number", placeholder: "0.00", value: form.client_cost, onChange: (e) => setForm({ ...form, client_cost: e.target.value }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Costo interno" }),
          /* @__PURE__ */ jsx(Input, { type: "number", placeholder: "0.00", value: form.internal_cost, onChange: (e) => setForm({ ...form, internal_cost: e.target.value }) })
        ] })
      ]
    }
  ) });
}

const repairColumns = [
  {
    accessorKey: "datetime",
    header: "Fecha",
    renderKey: "date"
  },
  {
    accessorKey: "client_name",
    header: "Cliente",
    renderKey: "general"
  },
  {
    accessorKey: "technician_name",
    header: "Técnico",
    renderKey: "general"
  },
  {
    accessorKey: "device_name",
    header: "Dispositivo",
    renderKey: "general"
  },
  {
    accessorKey: "repair_state",
    header: "Estado",
    renderKey: "general"
  },
  {
    accessorKey: "priority",
    header: "Prioridad",
    renderKey: "general"
  },
  {
    accessorKey: "description",
    header: "Descripcion",
    renderKey: "description"
  },
  {
    accessorKey: "diagnostic",
    header: "Diagnóstico",
    renderKey: "description"
  },
  {
    accessorKey: "client_cost",
    header: "Costo Cliente",
    renderKey: "money"
  },
  {
    accessorKey: "internal_cost",
    header: "Costo Interno",
    renderKey: "money"
  }
];

function RepairTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-repair", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.repair({ id: row.repair_id }).delete();
    window.location.reload();
  }, []);
  return /* @__PURE__ */ jsx(
    TableWrapper,
    {
      data,
      columns,
      onEdit: handleEdit,
      onDelete: handleDelete
    }
  );
}

function buildQuery(filters) {
  const query = {};
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
function RepairPageManager({
  initialRepairs,
  columns,
  clients,
  technicians,
  phones
}) {
  const [repairs, setRepairs] = useState(initialRepairs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: "",
    repair_state: "",
    priority: "",
    client_id: "",
    technician_id: "",
    device_id: "",
    cost_min: "",
    cost_max: "",
    deleted: "active"
  });
  const query = useMemo(() => buildQuery(filters), [filters]);
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
    () => repairs.map((r) => ({
      ...r,
      client_name: clientById.get(r.client_id) ?? "—",
      technician_name: technicianById.get(r.technician_id) ?? "—",
      device_name: phoneById.get(r.device_id) ?? "—"
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
      } catch (e) {
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
      deleted: "active"
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl border bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "date",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.date,
          onChange: (e) => setFilters((f) => ({ ...f, date: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.repair_state,
          onChange: (e) => setFilters((f) => ({ ...f, repair_state: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Estado" }),
            repairStates.map((p) => /* @__PURE__ */ jsx("option", { value: p.value, children: p.label }, p.value))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.priority,
          onChange: (e) => setFilters((f) => ({ ...f, priority: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Prioridad" }),
            priorities.map((p) => /* @__PURE__ */ jsx("option", { value: p.value, children: p.label }, p.value))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.client_id,
          onChange: (e) => setFilters((f) => ({ ...f, client_id: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los clientes" }),
            clients.map((c) => /* @__PURE__ */ jsx("option", { value: c.client_id, children: c.name }, c.client_id))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.technician_id,
          onChange: (e) => setFilters((f) => ({ ...f, technician_id: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los técnicos" }),
            technicians.map((t) => /* @__PURE__ */ jsx("option", { value: t.technician_id, children: t.name }, t.technician_id))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.device_id,
          onChange: (e) => setFilters((f) => ({ ...f, device_id: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los dispositivos" }),
            phones.map((p) => /* @__PURE__ */ jsx("option", { value: p.device_id, children: p.name }, p.device_id))
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Costo mín.",
          value: filters.cost_min,
          onChange: (e) => setFilters((f) => ({ ...f, cost_min: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Costo máx.",
          value: filters.cost_max,
          onChange: (e) => setFilters((f) => ({ ...f, cost_max: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.deleted,
          onChange: (e) => setFilters((f) => ({ ...f, deleted: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "active", children: "Activas" }),
            /* @__PURE__ */ jsx("option", { value: "deleted", children: "Eliminadas" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "Todas" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(RepairTableManager, { data, columns }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-gray-600", children: [
        loading ? "Buscando..." : `${data.length} resultado(s)`,
        error ? /* @__PURE__ */ jsx("span", { className: "text-red-600", children: error }) : null
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50",
          onClick: clearFilters,
          type: "button",
          children: "Limpiar filtros"
        }
      )
    ] })
  ] }) }) }) });
}

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const [repairsRes, clientsRes, techniciansRes, phonesRes] = await Promise.all([
    serverApp.repair.all.get({ query: { is_deleted: false } }),
    serverApp.client.all.get(),
    serverApp.technician.all.get(),
    serverApp.phone.all.get()
  ]);
  const repairs = repairsRes.data ?? [];
  const clients = clientsRes.data ?? [];
  const technicians = techniciansRes.data ?? [];
  const phones = phonesRes.data ?? [];
  const clientNameById = new Map(
    clients.map((c) => [c.client_id, c.name ?? "\u2014"])
  );
  const technicianNameById = new Map(
    technicians.map((t) => [t.technician_id, t.name ?? "\u2014"])
  );
  const phoneLabelById = new Map(
    phones.map((p) => [
      p.device_id,
      p.name ?? "-"
    ])
  );
  repairs.map((repair) => ({
    ...repair,
    client_name: clientNameById.get(repair.client_id) ?? "\u2014",
    technician_name: technicianNameById.get(repair.technician_id) ?? "\u2014",
    device_name: phoneLabelById.get(repair.device_id) ?? "\u2014"
  }));
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Reparaciones" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">Reparaciones</h1> ${renderComponent($$result2, "RepairPageManager", RepairPageManager, { "client:load": true, "initialRepairs": repairs, "clients": clients, "technicians": technicians, "phones": phones, "columns": repairColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/RepairPageManager", "client:component-export": "RepairPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
           text-sm font-medium text-black shadow-lg
           opacity-0 scale-95 transition-all duration-200 
           group-hover:opacity-100 group-hover:scale-100
           pointer-events-none">
Nueva Reparación
</span> ${renderComponent($$result2, "SheetFormRepair", SheetFormRepair, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormRepair", "client:component-export": "SheetFormRepair" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "default" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/repair/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/repair/index.astro";
const $$url = "/repair";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
