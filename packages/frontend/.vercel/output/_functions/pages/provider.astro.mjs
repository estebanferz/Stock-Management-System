/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { C as CustomSheet, L as Label, I as Input, B as Button, S as SheetClose, T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

function normalizePhoneE164(raw) {
  if (!raw) return null;
  const phone = parsePhoneNumberFromString(raw, "AR");
  if (!phone || !phone.isValid()) return null;
  return phone.format("E.164");
}
function SheetFormProvider({ isOpen, onClose, zIndex }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = isOpen !== void 0 ? isOpen : internalOpen;
  const handleOpenChange = (open) => {
    if (onClose) {
      if (!open) onClose();
    } else {
      setInternalOpen(open);
    }
  };
  const [editingProvider, setEditingProvider] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    address_st: "",
    address_number: ""
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingProvider(row);
      const address = row.address ?? "";
      const match = address.match(/^(.*?)(\d+)\s*$/);
      setForm({
        name: row.name ?? "",
        email: row.email ?? "",
        phone_number: row.phone_number ?? "",
        address_st: match ? match[1].trim() : "",
        address_number: match ? match[2] : ""
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-provider", onEdit);
    return () => window.removeEventListener("open-edit-provider", onEdit);
  }, []);
  const handleSubmitProvider = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const phoneE164 = normalizePhoneE164(form.phone_number);
    if (!phoneE164) {
      alert("El número de teléfono es inválido.");
      return;
    }
    const { address_st, address_number, ...restForm } = form;
    const providerData = {
      ...restForm,
      address: `${address_st} ${address_number}`.trim(),
      phone_number: phoneE164
    };
    try {
      let response;
      if (editingProvider) {
        response = await clientApp.provider({ id: editingProvider.provider_id }).put(providerData);
      } else {
        response = await clientApp.provider.post(providerData);
      }
      const { data, error } = response;
      if (error) throw error.value;
      const newProviderId = data?.[0]?.provider_id;
      onClose?.(newProviderId ? String(newProviderId) : void 0);
      window.location.reload();
    } catch (err) {
      console.error(err);
      onClose?.();
    }
  };
  const isNested = onClose !== void 0;
  const offsetClass = isNested ? "right-[380px]" : "";
  return /* @__PURE__ */ jsx("form", { id: "form-provider", onSubmit: handleSubmitProvider, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      title: "Agregar Proveedor",
      description: "Agregar proveedor al sistema",
      className: `${offsetClass}`,
      side: "right",
      isOpen: controlledOpen,
      onOpenChange: handleOpenChange,
      isModal: !onClose,
      zIndex: zIndex || (onClose ? 50 : 10),
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-provider", children: editingProvider ? "Guardar" : "Agregar" }),
        /* @__PURE__ */ jsx(SheetClose, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => handleOpenChange(false), children: "Cancelar" }) })
      ] }),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Nombre" }),
          /* @__PURE__ */ jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Email" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "email",
              value: form.email,
              onChange: (e) => setForm({ ...form, email: e.target.value }),
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Telefono" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.phone_number,
              onChange: (e) => setForm({
                ...form,
                phone_number: e.target.value.replace(/[^\d+]/g, "")
              }),
              onBlur: () => {
                const normalized = normalizePhoneE164(form.phone_number);
                if (normalized) setForm({ ...form, phone_number: normalized });
              },
              inputMode: "tel",
              placeholder: "+54 9 11 1234 5678",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: /* @__PURE__ */ jsx(
            Input,
            {
              value: form.address_st,
              onChange: (e) => setForm({ ...form, address_st: e.target.value })
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: form.address_number,
              onChange: (e) => setForm({ ...form, address_number: e.target.value })
            }
          ) })
        ] })
      ]
    }
  ) });
}

const providerColumns = [
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
    accessorKey: "address",
    header: "Dirección",
    renderKey: "general"
  }
];

function ProviderTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-provider", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.provider({ id: row.provider_id }).delete();
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
  if (filters.email.trim()) query.email = filters.email.trim();
  if (filters.phone_number.trim()) query.phone_number = filters.phone_number.trim();
  if (filters.address.trim()) query.address = filters.address.trim();
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  return query;
}
function ProviderPageManager({ initialData, columns }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    phone_number: "",
    address: "",
    deleted: "active"
  });
  const query = useMemo(() => buildQuery(filters), [filters]);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.provider.all.get({ query });
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
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
      /* @__PURE__ */ jsx(
        "input",
        {
          className: "w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2",
          placeholder: "Dirección",
          value: filters.address,
          onChange: (e) => setFilters((f) => ({ ...f, address: e.target.value }))
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
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(ProviderTableManager, { data, columns }) }),
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
  const response = await serverApp.provider.all.get({ query: { is_deleted: false } });
  const data = response.data || [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Proveedores" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">
Proveedores
</h1> ${renderComponent($$result2, "ProviderPageManager", ProviderPageManager, { "client:load": true, "initialData": data, "columns": providerColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/ProviderPageManager", "client:component-export": "ProviderPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
         text-sm font-medium text-black shadow-lg
         opacity-0 scale-95 transition-all duration-200 
         group-hover:opacity-100 group-hover:scale-100
         pointer-events-none">
Nuevo Proveedor
</span> ${renderComponent($$result2, "SheetFormProvider", SheetFormProvider, { "zIndex": 60, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormProvider", "client:component-export": "SheetFormProvider" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "ActionPanel" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/provider/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/provider/index.astro";
const $$url = "/provider";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
