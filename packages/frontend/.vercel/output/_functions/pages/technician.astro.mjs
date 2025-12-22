/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { C as CustomSheet, L as Label, I as Input, B as Button, S as SheetClose, T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { C as Checkbox } from '../chunks/checkbox_BMTKeZ0q.mjs';
import parsePhoneNumberFromString from 'libphonenumber-js';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

function normalizePhoneE164(raw) {
  if (!raw) return null;
  const phone = parsePhoneNumberFromString(raw, "AR");
  if (!phone || !phone.isValid()) return null;
  return phone.format("E.164");
}
function SheetFormTechnician({ zIndex }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    speciality: "",
    state: false
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingTechnician(row);
      setForm({
        name: row.name ?? "",
        email: row.email ? String(row.email) : "",
        phone_number: row.phone_number ?? "",
        speciality: row.speciality ?? "",
        state: row.state === "activo" ? true : false
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-technician", onEdit);
    return () => window.removeEventListener("open-edit-technician", onEdit);
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    let active;
    if (form.state) {
      active = "activo";
    } else {
      active = "inactivo";
    }
    const technicianData = {
      name: form.name,
      email: form.email,
      phone_number: form.phone_number,
      speciality: form.speciality,
      state: active
    };
    try {
      let response;
      if (editingTechnician) {
        response = await clientApp.technician({ id: editingTechnician.technician_id }).put(technicianData);
      } else {
        response = await clientApp.technician.post(technicianData);
      }
      const { data, error } = response;
      if (error) throw error.value;
      window.location.reload();
    } catch (err) {
      console.error("Error al cargar tecnico:", err);
      alert("Error al cargar tecnico");
    }
  };
  return /* @__PURE__ */ jsx("form", { id: "form-sale", onSubmit: handleSubmit, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      title: "Agregar Técnico",
      zIndex,
      isOpen: internalOpen,
      onOpenChange: setInternalOpen,
      description: "Agregar técnico al sistema",
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
              placeholder: "+54 9 11 1234 5678",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Especialidad" }),
          /* @__PURE__ */ jsx(Input, { value: form.speciality, onChange: (e) => setForm({ ...form, speciality: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Activo" }),
          /* @__PURE__ */ jsx(Checkbox, { checked: form.state, onCheckedChange: (checked) => setForm({ ...form, state: !!checked }) })
        ] })
      ]
    }
  ) });
}

const technicianColumns = [
  {
    accessorKey: "name",
    header: "Nombre",
    renderKey: "general"
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
    accessorKey: "speciality",
    header: "Especialidad",
    renderKey: "description"
  },
  {
    accessorKey: "state",
    header: "Estado"
  }
];

function TechnicianTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-technician", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.technician({ id: row.technician_id }).delete();
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

const technicianStates = [
  { value: "activo", label: "Activo" },
  { value: "inactivo", label: "Inactivo" }
];

function buildQuery(filters) {
  const query = {};
  if (filters.name.trim()) query.name = filters.name.trim();
  if (filters.speciality.trim()) query.speciality = filters.speciality.trim();
  if (filters.state.trim()) query.state = filters.state.trim();
  if (filters.email.trim()) query.email = filters.email.trim();
  if (filters.phone_number.trim()) query.phone_number = filters.phone_number.trim();
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  return query;
}
function TechnicianPageManager({ initialData, columns }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    name: "",
    speciality: "",
    state: "",
    email: "",
    phone_number: "",
    deleted: "active"
  });
  const query = useMemo(() => buildQuery(filters), [filters]);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await clientApp.technician.all.get({ query });
        setData(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
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
          placeholder: "Especialidad",
          value: filters.speciality,
          onChange: (e) => setFilters((f) => ({ ...f, speciality: e.target.value }))
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
          value: filters.state,
          onChange: (e) => setFilters((f) => ({ ...f, state: e.target.value })),
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Estado" }),
            technicianStates.map((s) => /* @__PURE__ */ jsx("option", { value: s.value, children: s.label }, s.value))
          ]
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
      ),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block" }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block" }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block" }),
      /* @__PURE__ */ jsx("div", { className: "hidden lg:block" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(TechnicianTableManager, { data, columns }) }),
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
  const response = await serverApp.technician.all.get({ query: { is_deleted: false } });
  const data = response.data || [];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Tecnicos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">Técnicos</h1> ${renderComponent($$result2, "TechnicianPageManager", TechnicianPageManager, { "client:load": true, "initialData": data, "columns": technicianColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/TechnicianPageManager", "client:component-export": "TechnicianPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
           text-sm font-medium text-black shadow-lg
           opacity-0 scale-95 transition-all duration-200 
           group-hover:opacity-100 group-hover:scale-100
           pointer-events-none">
Nuevo Técnico
</span> ${renderComponent($$result2, "SheetFormTechnician", SheetFormTechnician, { "zIndex": 60, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormTechnician", "client:component-export": "SheetFormTechnician" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "default" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/technician/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/technician/index.astro";
const $$url = "/technician";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
