/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { p as phoneCategories, a as productTypes, S as SheetFormPhone } from '../chunks/SheetFormPhone_CrxcRi9R.mjs';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useCallback, useState, useMemo, useEffect } from 'react';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

const phoneColumns = [
  {
    accessorKey: "brand",
    header: "Marca",
    renderKey: "general"
  },
  {
    accessorKey: "name",
    header: "Modelo",
    renderKey: "general"
  },
  {
    accessorKey: "price",
    header: "Precio",
    renderKey: "money"
  },
  {
    accessorKey: "buy_cost",
    header: "Costo",
    renderKey: "money"
  },
  {
    accessorKey: "imei",
    header: "IMEI"
  },
  {
    accessorKey: "battery_health",
    header: "%Bat."
  },
  {
    accessorKey: "storage_capacity",
    header: "Almacenamiento"
  },
  {
    accessorKey: "color",
    header: "Color",
    renderKey: "general"
  },
  {
    accessorKey: "category",
    header: "Categoría",
    renderKey: "general"
  },
  {
    accessorKey: "deposit",
    header: "Depósito",
    renderKey: "general"
  },
  {
    accessorKey: "sold",
    header: "Vendido"
  }
];

function PhoneTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-phone", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.phone({ id: row.device_id }).delete();
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
  if (filters.device.trim()) query.device = filters.device.trim();
  if (filters.imei.trim()) query.imei = filters.imei.trim();
  const storage = filters.storage_capacity.trim();
  if (storage) query.storage_capacity = storage;
  const battery = filters.battery_health.trim();
  if (battery) query.battery_health = battery;
  if (filters.color.trim()) query.color = filters.color.trim();
  if (filters.category.trim()) query.category = filters.category.trim();
  if (filters.device_type.trim()) query.device_type = filters.device_type.trim();
  if (filters.trade_in !== "all") query.trade_in = filters.trade_in;
  if (filters.sold === "sold") query.sold = "true";
  if (filters.sold === "available") query.sold = "false";
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  return query;
}
function PhonesPageManager({ initialData, columns }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    device: "",
    imei: "",
    storage_capacity: "",
    battery_health: "",
    color: "",
    category: "",
    // ✅ "todas" por defecto
    device_type: "",
    // ✅ "todos" por defecto
    trade_in: "all",
    sold: "all",
    deleted: "active"
  });
  const query = useMemo(() => buildQuery(filters), [filters]);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.phone.all.get({ query });
        setData(res.data || []);
      } catch (e) {
        setError(e?.message ?? "Error buscando dispositivos");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query]);
  function clearFilters() {
    setFilters({
      device: "",
      imei: "",
      storage_capacity: "",
      battery_health: "",
      color: "",
      category: "",
      device_type: "",
      trade_in: "all",
      sold: "all",
      deleted: "active"
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl", children: /* @__PURE__ */ jsx("div", { className: "rounded-2xl border bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Marca / Modelo",
          value: filters.device,
          onChange: (e) => setFilters((f) => ({ ...f, device: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "IMEI (exacto)",
          value: filters.imei,
          onChange: (e) => setFilters((f) => ({ ...f, imei: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          inputMode: "numeric",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Almacenamiento (GB)",
          value: filters.storage_capacity,
          onChange: (e) => setFilters((f) => ({
            ...f,
            storage_capacity: e.target.value
          }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          inputMode: "numeric",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Batería ≥ %",
          value: filters.battery_health,
          onChange: (e) => setFilters((f) => ({
            ...f,
            battery_health: e.target.value
          }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Color",
          value: filters.color,
          onChange: (e) => setFilters((f) => ({ ...f, color: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.category,
          onChange: (e) => setFilters((f) => ({ ...f, category: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todas las categorías" }),
            phoneCategories.map((c) => /* @__PURE__ */ jsx("option", { value: c.value, children: c.label }, c.value))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.device_type,
          onChange: (e) => setFilters((f) => ({ ...f, device_type: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los tipos" }),
            productTypes.map((type) => /* @__PURE__ */ jsx("option", { value: type.value, children: type.label }, type.value))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.trade_in,
          onChange: (e) => setFilters((f) => ({
            ...f,
            trade_in: e.target.value
          })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "all", children: "Trade-in y no" }),
            /* @__PURE__ */ jsx("option", { value: "true", children: "Trade-in" }),
            /* @__PURE__ */ jsx("option", { value: "false", children: "No Trade-in" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.sold,
          onChange: (e) => setFilters((f) => ({
            ...f,
            sold: e.target.value
          })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "available", children: "Disponibles" }),
            /* @__PURE__ */ jsx("option", { value: "sold", children: "Vendidos" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "Vendidos y disponibles" })
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          value: filters.deleted,
          onChange: (e) => setFilters((f) => ({
            ...f,
            deleted: e.target.value
          })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "active", children: "Activos" }),
            /* @__PURE__ */ jsx("option", { value: "deleted", children: "Eliminados" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "Todos" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(PhoneTableManager, { data, columns }) }),
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
  const response = await serverApp.phone.all.get({ query: { is_deleted: false } });
  const data = Array.isArray(response.data) ? response.data : [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Inventario" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">Inventario</h1> ${renderComponent($$result2, "PhonesPageManager", PhonesPageManager, { "client:load": true, "initialData": data, "columns": phoneColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/PhonePageManager", "client:component-export": "PhonesPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
           text-sm font-medium text-black shadow-lg
           opacity-0 scale-95 transition-all duration-200 
           group-hover:opacity-100 group-hover:scale-100
           pointer-events-none">
Nuevo dispositivo
</span> ${renderComponent($$result2, "SheetFormPhone", SheetFormPhone, { "zIndex": 60, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormPhone", "client:component-export": "SheetFormPhone" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "default" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/inventory/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/inventory/index.astro";
const $$url = "/inventory";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
