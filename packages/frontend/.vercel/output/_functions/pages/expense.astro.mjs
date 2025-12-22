/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { p as paymentMethods, S as SheetFormExpense } from '../chunks/SheetFormExpense_D5hzPyyW.mjs';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { jsx, jsxs } from 'react/jsx-runtime';
import { useCallback, useState, useMemo, useEffect } from 'react';
export { renderers } from '../renderers.mjs';

const expenseColumns = [
  {
    accessorKey: "datetime",
    header: "Fecha",
    renderKey: "date"
  },
  {
    accessorKey: "category",
    header: "Categoría",
    renderKey: "general"
  },
  {
    accessorKey: "description",
    header: "Descripción"
  },
  {
    accessorKey: "amount",
    header: "Monto",
    renderKey: "money"
  },
  {
    accessorKey: "payment_method",
    header: "Pago",
    renderKey: "paymentMethod"
  },
  {
    accessorKey: "receipt_number",
    header: "Comprobante",
    renderKey: "receipt"
  },
  {
    accessorKey: "provider_name",
    header: "Proveedor",
    renderKey: "general"
  }
];

function ExpenseTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    const ev = new CustomEvent("open-edit-expense", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.expense({ id: row.expense_id }).delete();
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
  if (filters.category.trim()) query.category = filters.category.trim();
  if (filters.payment_method.trim()) query.payment_method = filters.payment_method.trim();
  if (filters.provider_id) query.provider_id = filters.provider_id;
  if (filters.amount_min) query.amount_min = filters.amount_min;
  if (filters.amount_max) query.amount_max = filters.amount_max;
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  return query;
}
function ExpensesPageManager({
  initialExpenses,
  providers,
  columns
}) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: "",
    category: "",
    payment_method: "",
    provider_id: "",
    amount_min: "",
    amount_max: "",
    deleted: "active"
  });
  const providerById = useMemo(
    () => new Map(providers.map((p) => [p.provider_id, p.name])),
    [providers]
  );
  const enrichedExpenses = useMemo(
    () => expenses.map((exp) => ({
      ...exp,
      provider_name: providerById.get(exp.provider_id) ?? "—"
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
      deleted: "active"
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl rounded-2xl border bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "date",
          value: filters.date,
          onChange: (e) => setFilters((f) => ({ ...f, date: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          placeholder: "Categoría",
          value: filters.category,
          onChange: (e) => setFilters((f) => ({ ...f, category: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm"
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filters.payment_method,
          onChange: (e) => setFilters((f) => ({ ...f, payment_method: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los métodos de pago" }),
            paymentMethods.map((pm) => /* @__PURE__ */ jsx("option", { value: pm.value, children: pm.label }, pm.value))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filters.provider_id,
          onChange: (e) => setFilters((f) => ({ ...f, provider_id: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los proveedores" }),
            providers.map((p) => /* @__PURE__ */ jsx("option", { value: p.provider_id, children: p.name }, p.provider_id))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filters.deleted,
          onChange: (e) => setFilters((f) => ({ ...f, deleted: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "active", children: "Activos" }),
            /* @__PURE__ */ jsx("option", { value: "deleted", children: "Eliminados" }),
            /* @__PURE__ */ jsx("option", { value: "all", children: "Todos" })
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          placeholder: "Monto mínimo",
          value: filters.amount_min,
          onChange: (e) => setFilters((f) => ({ ...f, amount_min: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm"
        }
      ),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "number",
          placeholder: "Monto máximo",
          value: filters.amount_max,
          onChange: (e) => setFilters((f) => ({ ...f, amount_max: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(ExpenseTableManager, { data: enrichedExpenses, columns }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-gray-600", children: [
        loading ? "Buscando..." : `${expenses.length} resultado(s)`,
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
  ] }) }) });
}

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const [expensesRes, providerRes] = await Promise.all([
    serverApp.expense.all.get({ query: { is_deleted: false } }),
    serverApp.provider.all.get()
  ]);
  const expenses = expensesRes.data ?? [];
  const providers = providerRes.data ?? [];
  const providerNameById = new Map(
    providers.map((c) => [c.provider_id, c.name ?? "\u2014"])
  );
  expenses.map((expense) => ({
    ...expense,
    provider_name: providerNameById.get(expense.provider_id) ?? "\u2014"
  }));
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Gastos" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">Gastos</h1> ${renderComponent($$result2, "ExpensesPageManager", ExpensesPageManager, { "client:load": true, "initialExpenses": expenses, "providers": providers, "columns": expenseColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/ExpensePageManager", "client:component-export": "ExpensesPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
           text-sm font-medium text-black shadow-lg
           opacity-0 scale-95 transition-all duration-200 
           group-hover:opacity-100 group-hover:scale-100
           pointer-events-none">
Nuevo gasto
</span> ${renderComponent($$result2, "SheetFormExpense", SheetFormExpense, { "zIndex": 60, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormExpense", "client:component-export": "SheetFormExpense" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "default" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/expense/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/expense/index.astro";
const $$url = "/expense";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
