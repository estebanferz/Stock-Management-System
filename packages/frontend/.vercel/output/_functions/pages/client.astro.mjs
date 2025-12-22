/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { S as SheetFormClient } from '../chunks/SheetFormClient_BuaD2Afj.mjs';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useCallback, useState, useMemo, useEffect } from 'react';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

const clientColumns = [
  {
    accessorKey: "name",
    header: "Nombre"
  },
  {
    accessorKey: "email",
    header: "Email"
  },
  {
    accessorKey: "phone_number",
    header: "Teléfono",
    renderKey: "phone"
  },
  {
    accessorKey: "id_number",
    header: "DNI"
  },
  {
    accessorKey: "debt",
    header: "Deuda",
    renderKey: "money"
  }
];

function ClientsTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-client", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.client({ id: row.client_id }).delete();
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
  if (filters.name.trim()) query.name = filters.name.trim();
  if (filters.id_number.trim()) query.id_number = filters.id_number.trim();
  if (filters.email.trim()) query.email = filters.email.trim();
  if (filters.phone_number.trim()) query.phone_number = filters.phone_number.trim();
  if (filters.deleted === "active") query.is_deleted = false;
  if (filters.deleted === "deleted") query.is_deleted = true;
  return query;
}
function ClientsPageManager({ initialData, columns }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    id_number: "",
    email: "",
    phone_number: "",
    deleted: "active"
    // por defecto “no borrados”, como tu SSR
  });
  const query = useMemo(() => buildQuery(filters), [filters]);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.client.all.get({ query });
        setData(res.data || []);
      } catch (e) {
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
      deleted: "active"
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl border bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Nombre",
          value: filters.name,
          onChange: (e) => setFilters((f) => ({ ...f, name: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "DNI (completo)",
          inputMode: "numeric",
          value: filters.id_number,
          onChange: (e) => setFilters((f) => ({
            ...f,
            id_number: e.target.value.replace(/\D/g, "")
            // 🔥 clave
          }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Email",
          value: filters.email,
          onChange: (e) => setFilters((f) => ({ ...f, email: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Teléfono",
          value: filters.phone_number,
          onChange: (e) => setFilters((f) => ({ ...f, phone_number: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.deleted,
          onChange: (e) => setFilters((f) => ({ ...f, deleted: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "active", children: "Activos" }),
            /* @__PURE__ */ jsx("option", { value: "deleted", children: "Eliminados" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "Todos" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(ClientsTableManager, { data, columns }) }),
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
  const response = await serverApp.client.all.get({ query: { is_deleted: false } });
  const data = response.data || [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Clientes" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">
Clientes
</h1> ${renderComponent($$result2, "ClientsPageManager", ClientsPageManager, { "client:load": true, "initialData": data, "columns": clientColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/ClientPageManager", "client:component-export": "ClientsPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
         text-sm font-medium text-black shadow-lg
         opacity-0 scale-95 transition-all duration-200 
         group-hover:opacity-100 group-hover:scale-100
         pointer-events-none">
Nuevo Cliente
</span> ${renderComponent($$result2, "SheetFormClient", SheetFormClient, { "zIndex": 60, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormClient", "client:component-export": "SheetFormClient" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "ActionPanel" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/client/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/client/index.astro";
const $$url = "/client";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
