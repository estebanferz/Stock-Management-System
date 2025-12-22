/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { C as CustomSheet, L as Label, I as Input, B as Button, S as SheetClose, T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { t as toInputDate, c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

const getLocalTime = () => {
  const today = /* @__PURE__ */ new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 6e4);
};
function normalizePhoneE164(raw) {
  if (!raw) return null;
  const phone = parsePhoneNumberFromString(raw, "AR");
  if (!phone || !phone.isValid()) return null;
  return phone.format("E.164");
}
function SheetFormSeller({ zIndex }) {
  const initialLocalTime = getLocalTime();
  const [hireDate, setHireDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [payDate, setPayDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    phone_number: "",
    hire_date: "",
    pay_date: "",
    commission: ""
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingSeller(row);
      setHireDate(toInputDate(row.hire_date));
      setPayDate(toInputDate(row.pay_date));
      setForm({
        name: row.name ?? "",
        age: row.age ? String(row.age) : "",
        email: row.email ? String(row.email) : "",
        phone_number: row.phone_number ?? "",
        hire_date: row.hire_date ?? "",
        pay_date: row.pay_date ?? "",
        commission: row.commission ? String(row.commission) : ""
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-seller", onEdit);
    return () => window.removeEventListener("open-edit-seller", onEdit);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(hireDate.toString().split("T")[0]);
    const sellerData = {
      name: form.name,
      age: parseInt(form.age),
      email: form.email,
      phone_number: form.phone_number,
      hire_date: hireDate.toString().split("T")[0],
      pay_date: payDate.toString().split("T")[0],
      commission: form.commission
    };
    try {
      let response;
      if (editingSeller) {
        response = await clientApp.seller({ id: editingSeller.seller_id }).put(sellerData);
      } else {
        response = await clientApp.seller.post(sellerData);
      }
      const { data, error } = response;
      if (error) throw error.value;
      window.location.reload();
    } catch (err) {
      console.error("Error al cargar vendedor:", err);
      alert("Error al cargar vendedor");
    }
  };
  return /* @__PURE__ */ jsx("form", { id: "form-sale", onSubmit: handleSubmit, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      title: "Agregar Vendedor",
      zIndex,
      isOpen: internalOpen,
      onOpenChange: setInternalOpen,
      description: "Agregar vendedor al sistema",
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-sale", children: "Agregar" }),
        /* @__PURE__ */ jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", children: "Cancelar" }) })
      ] }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Nombre" }),
          /* @__PURE__ */ jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Edad" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: form.age,
              onChange: (e) => setForm({ ...form, age: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Email" }),
          /* @__PURE__ */ jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm({ ...form, email: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Telefono" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.phone_number,
              onChange: (e) => {
                setForm({ ...form, phone_number: e.target.value.replace(/[^\d+]/g, "") });
              },
              onBlur: () => {
                const normalized = normalizePhoneE164(form.phone_number);
                if (normalized) setForm({ ...form, phone_number: normalized });
              },
              inputMode: "tel",
              placeholder: "+54 9 223 1234567",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Comisión" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.commission,
              onChange: (e) => setForm({ ...form, commission: e.target.value }),
              type: "number",
              placeholder: "0.00",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Fecha de contratación" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "date",
              value: hireDate,
              onChange: (e) => setHireDate(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Fecha de pago" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "date",
              value: payDate,
              onChange: (e) => setPayDate(e.target.value)
            }
          )
        ] })
      ]
    }
  ) });
}

const sellerColumns = [
  { accessorKey: "name", header: "Nombre", renderKey: "general" },
  { accessorKey: "age", header: "Edad" },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "phone_number",
    header: "Teléfono",
    renderKey: "phone"
  },
  {
    accessorKey: "commission",
    header: "Comisión (%)"
  },
  {
    accessorKey: "hire_date",
    header: "Contratación",
    renderKey: "date"
  },
  {
    accessorKey: "pay_date",
    header: "Fecha Pago",
    renderKey: "date"
  }
];

function SellerTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-seller", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.seller({ id: row.seller_id }).delete();
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
  if (filters.hire_date) query.hire_date = filters.hire_date;
  if (filters.pay_date) query.pay_date = filters.pay_date;
  if (filters.age_min) query.age_min = filters.age_min;
  if (filters.age_max) query.age_max = filters.age_max;
  if (filters.commission_min) query.commission_min = filters.commission_min;
  if (filters.commission_max) query.commission_max = filters.commission_max;
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  return query;
}
function SellerPageManager({ initialData, columns }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    hire_date: "",
    pay_date: "",
    age_min: "",
    age_max: "",
    commission_min: "",
    commission_max: "",
    deleted: "active"
  });
  const query = useMemo(() => buildQuery(filters), [filters]);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.seller.all.get({ query });
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
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
      /* @__PURE__ */ jsxs("div", { className: "relative group w-full", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
            value: filters.hire_date,
            onChange: (e) => setFilters((f) => ({ ...f, hire_date: e.target.value }))
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "absolute -top-9 left-0 z-50 whitespace-nowrap rounded-md border bg-white px-3 py-1 text-xs font-medium text-black shadow-lg\n                            opacity-0 scale-95 transition-all duration-200\n                            group-hover:opacity-100 group-hover:scale-100\n                            pointer-events-none",
            children: "Fecha de contratación"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative group w-full", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
            value: filters.pay_date,
            onChange: (e) => setFilters((f) => ({ ...f, pay_date: e.target.value }))
          }
        ),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: "absolute -top-9 left-0 z-50 whitespace-nowrap rounded-md border bg-white px-3 py-1 text-xs font-medium text-black shadow-lg\n                            opacity-0 scale-95 transition-all duration-200\n                            group-hover:opacity-100 group-hover:scale-100\n                            pointer-events-none",
            children: "Fecha de cobro"
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Edad mín.",
          value: filters.age_min,
          onChange: (e) => setFilters((f) => ({ ...f, age_min: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Edad máx.",
          value: filters.age_max,
          onChange: (e) => setFilters((f) => ({ ...f, age_max: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Comisión mín. (%)",
          value: filters.commission_min,
          onChange: (e) => setFilters((f) => ({ ...f, commission_min: e.target.value }))
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Comisión máx. (%)",
          value: filters.commission_max,
          onChange: (e) => setFilters((f) => ({ ...f, commission_max: e.target.value }))
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
      ),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block" }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(SellerTableManager, { data, columns }) }),
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
  const response = await serverApp.seller.all.get({ query: { is_deleted: false } });
  const data = response.data || [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Vendedores" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">Vendedores</h1> ${renderComponent($$result2, "SellerPageManager", SellerPageManager, { "client:load": true, "initialData": data, "columns": sellerColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/SellerPageManager", "client:component-export": "SellerPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
           text-sm font-medium text-black shadow-lg
           opacity-0 scale-95 transition-all duration-200 
           group-hover:opacity-100 group-hover:scale-100
           pointer-events-none">
Nuevo Vendedor
</span> ${renderComponent($$result2, "SheetFormSeller", SheetFormSeller, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormSeller", "client:component-export": "SheetFormSeller" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "default" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/seller/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/seller/index.astro";
const $$url = "/seller";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
