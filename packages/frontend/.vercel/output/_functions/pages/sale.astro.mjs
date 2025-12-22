/* empty css                                 */
import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { C as CustomSheet, L as Label, I as Input, B as Button, T as TableWrapper, $ as $$Layout, A as ActionPanel } from '../chunks/TableWrapper_C4p9y2vA.mjs';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { S as SheetSelector, D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from '../chunks/dropdown-menu_p3DDvNeO.mjs';
import { p as paymentMethods } from '../chunks/SheetFormExpense_D5hzPyyW.mjs';
import { ChevronDown } from 'lucide-react';
import { C as Checkbox } from '../chunks/checkbox_BMTKeZ0q.mjs';
import { c as clientApp, s as serverApp } from '../chunks/formatters_DicF_a8O.mjs';
import { S as SheetFormClient } from '../chunks/SheetFormClient_BuaD2Afj.mjs';
import { S as SheetFormPhone } from '../chunks/SheetFormPhone_CrxcRi9R.mjs';
import '../chunks/schema_CjPU5Hou.mjs';
export { renderers } from '../renderers.mjs';

const getLocalTime = () => {
  const today = /* @__PURE__ */ new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 6e4);
};
function SheetFormSale({ zIndex }) {
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16));
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false);
  const [isPhoneSheetOpen, setIsPhoneSheetOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [form, setForm] = useState({
    datetime: "",
    total_amount: "",
    payment_method: "Pago",
    debt: false,
    debt_amount: "",
    client_id: "",
    seller_id: "",
    device_id: "",
    trade_in_device: ""
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingSale(row);
      const iso = row.datetime instanceof Date ? row.datetime.toISOString() : String(row.datetime);
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));
      setForm({
        datetime: row.datetime ? String(row.datetime) : "",
        total_amount: row.total_amount ? String(row.total_amount) : "",
        payment_method: row.payment_method ?? "",
        debt: row.debt ?? false,
        debt_amount: row.debt_amount ? String(row.debt_amount) : "",
        client_id: row.client_id ? String(row.client_id) : "",
        seller_id: row.seller_id ? String(row.seller_id) : "",
        device_id: row.device_id ? String(row.device_id) : "",
        trade_in_device: row.trade_in_device ? String(row.trade_in_device) : ""
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-sale", onEdit);
    return () => window.removeEventListener("open-edit-sale", onEdit);
  }, []);
  const handleDeviceSelect = (id, price) => {
    setForm({ ...form, device_id: id });
    if (price) {
      setForm((prev) => ({ ...prev, total_amount: price }));
    }
  };
  const handleAddTradeInPhone = () => {
    setIsPhoneSheetOpen(true);
  };
  const handlePhoneFormClose = (newPhoneId) => {
    setIsPhoneSheetOpen(false);
    if (newPhoneId) {
      setForm({ ...form, trade_in_device: newPhoneId });
    }
  };
  const handleSubmitSale = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const toInt = (v) => {
      const n = typeof v === "string" ? Number(v) : Number(v);
      if (!Number.isFinite(n)) return 0;
      return Math.round(n);
    };
    const datetime = `${date}T${time}:00Z`;
    alert("Submitting sale with datetime:" + datetime);
    if (!form.client_id || !form.seller_id || !form.device_id) {
      alert("Por favor, selecciona Cliente, Vendedor y Dispositivo.");
      return;
    }
    const saleData = {
      ...form,
      datetime,
      debt_amount: form.debt ? form.debt_amount : null,
      client_id: Number(form.client_id),
      payment_method: form.payment_method,
      device_id: Number(form.device_id),
      total_amount: form.total_amount,
      seller_id: Number(form.seller_id),
      trade_in_device: form.trade_in_device ? Number(form.trade_in_device) : null
    };
    try {
      let response;
      const isEditing = !!editingSale;
      if (isEditing) {
        response = await clientApp.sale({ id: editingSale.sale_id }).put(saleData);
      } else {
        response = await clientApp.sale.post(saleData);
        if (saleData.debt && saleData.debt_amount) {
          const clientId = Number(saleData.client_id);
          const addDebt = toInt(saleData.debt_amount);
          const { data: clientRow, error: clientGetError } = await clientApp.client({ id: clientId }).get();
          if (clientGetError || !clientRow) {
            console.error("Error fetching client:", clientGetError);
          } else {
            const currentDebt = toInt(clientRow.debt);
            const newDebt = currentDebt + addDebt;
            const clientData = {
              ...clientRow,
              debt: newDebt,
              id_number: String(clientRow.id_number)
            };
            delete clientData.datetime;
            const { error: clientPutError } = await clientApp.client({ id: clientId }).put(clientData);
            if (clientPutError) {
              console.error(
                "Failed to update client debt:",
                clientPutError.value ?? clientPutError
              );
            }
          }
        }
        const seller_id = saleData.seller_id;
        const { data: sellerData, error: sellerError } = await clientApp.seller({ id: seller_id }).get();
        if (sellerError || !sellerData) {
          console.error("Error fetching seller data:", sellerError);
          throw new Error("Failed to fetch seller data");
        }
        const seller_commission = parseFloat(sellerData.commission);
        try {
          const expensePayload = {
            datetime,
            category: "Comisión",
            description: `Comisión por venta (${sellerData.name})`,
            amount: String(
              Number(seller_commission) / 100 * Number(saleData.total_amount)
            ),
            payment_method: saleData.payment_method ?? "Unknown",
            receipt_number: null,
            provider_id: null
          };
          const { error: expenseError } = await clientApp.expense.post(expensePayload);
          if (expenseError) {
            console.error(
              "Failed to create commission expense:",
              expenseError.value ?? expenseError
            );
          } else {
            console.log("Commission expense created.");
          }
        } catch (err) {
          console.error("Error creating commission expense:", err);
        }
      }
      const { error } = response;
      if (error) throw error.value;
      if (!isEditing) {
        const deviceIdNumber = Number(form.device_id);
        const { data: currentPhoneData, error: getError } = await clientApp.phone({ id: deviceIdNumber }).get();
        if (getError || !currentPhoneData) {
          window.location.reload();
          return;
        }
        const updatePayload = {
          ...currentPhoneData,
          sold: true
        };
        const { error: phoneUpdateError } = await clientApp.phone({ id: deviceIdNumber }).put(updatePayload);
        if (phoneUpdateError) {
          console.error(
            "Falló la actualización final del dispositivo:",
            phoneUpdateError.value
          );
        } else {
          console.log("Device marked as sold.");
        }
      }
      window.location.reload();
    } catch (err) {
      console.error("Error al cargar venta:", err);
      alert("Error al cargar venta");
    }
  };
  const handleAddClient = () => {
    setIsClientSheetOpen(true);
  };
  const handleClientFormClose = (newClientId) => {
    setIsClientSheetOpen(false);
    if (newClientId) {
      setForm({ ...form, client_id: newClientId });
    }
  };
  return /* @__PURE__ */ jsx("form", { id: "form-sale", onSubmit: handleSubmitSale, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      className: "w-[400px] duration-300 flex flex-col",
      title: "Agregar Venta",
      zIndex,
      isOpen: internalOpen,
      onOpenChange: setInternalOpen,
      description: "Agregar venta de dispositivo al sistema",
      isModal: true,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-sale", children: "Agregar" }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setInternalOpen(false), children: "Cancelar" })
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
          /* @__PURE__ */ jsx(Label, { children: "Vendedor" }),
          /* @__PURE__ */ jsx(SheetSelector, { type: "seller", currentId: form.seller_id, onSelect: (id) => setForm({ ...form, seller_id: id }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Cliente" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsx(SheetSelector, { type: "client", currentId: form.client_id, onSelect: (id) => setForm({ ...form, client_id: id }) }) }),
            /* @__PURE__ */ jsx(
              Button,
              {
                className: "col-span-1",
                type: "button",
                onClick: (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddClient();
                },
                children: "Agregar"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          SheetFormClient,
          {
            isOpen: isClientSheetOpen,
            onClose: handleClientFormClose,
            zIndex: 60
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Dispositivo" }),
          /* @__PURE__ */ jsx(SheetSelector, { type: "device", currentId: form.device_id, onSelect: handleDeviceSelect })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Valor" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              value: form.total_amount,
              onChange: (e) => setForm({ ...form, total_amount: e.target.value }),
              type: "number",
              placeholder: "0.00",
              step: "0.01",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Trade-In" }),
          /* @__PURE__ */ jsx(Button, { type: "button", onClick: handleAddTradeInPhone, children: "Agregar Trade-In" })
        ] }),
        isPhoneSheetOpen && /* @__PURE__ */ jsx(
          SheetFormPhone,
          {
            isOpen: isPhoneSheetOpen,
            onClose: handlePhoneFormClose,
            zIndex: 60,
            depth: 1
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Método de pago" }),
          /* @__PURE__ */ jsxs(DropdownMenu, { children: [
            /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto w-full justify-between font-normal", children: [
              form.payment_method,
              " ",
              /* @__PURE__ */ jsx(ChevronDown, {})
            ] }) }),
            /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: paymentMethods.map((method) => /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setForm({ ...form, payment_method: method.value }), children: method.label }, method.value)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Debe" }),
          /* @__PURE__ */ jsx(Checkbox, { checked: form.debt, onCheckedChange: (checked) => setForm({ ...form, debt: !!checked }) })
        ] }),
        form.debt && /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Cuánto debe" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: form.debt_amount,
              onChange: (e) => setForm({ ...form, debt_amount: e.target.value }),
              placeholder: "0.00",
              required: form.debt
            }
          )
        ] })
      ]
    }
  ) });
}

const saleColumns = [
  {
    accessorKey: "datetime",
    header: "Fecha",
    renderKey: "date"
  },
  { accessorKey: "client_name", header: "Cliente", renderKey: "general" },
  { accessorKey: "seller_name", header: "Vendedor", renderKey: "general" },
  { accessorKey: "device_name", header: "Disp.", renderKey: "general" },
  {
    accessorKey: "total_amount",
    header: "Total",
    renderKey: "money"
  },
  {
    accessorKey: "payment_method",
    header: "Método",
    renderKey: "paymentMethod"
  },
  {
    accessorKey: "debt",
    header: "¿Deuda?",
    renderKey: "yesno"
  },
  {
    accessorKey: "debt_amount",
    header: "Monto adeudado",
    renderKey: "money"
  }
];

function SaleTableManager({ data, columns }) {
  const handleEdit = useCallback((row) => {
    console.log("ENTRA HANDLEEDIT");
    const ev = new CustomEvent("open-edit-sale", { detail: row });
    window.dispatchEvent(ev);
  }, []);
  const handleDelete = useCallback(async (row) => {
    await clientApp.sale({ id: row.sale_id }).delete();
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
  if (filters.client_id) query.client_id = filters.client_id;
  if (filters.seller_id) query.seller_id = filters.seller_id;
  if (filters.device_id) query.device_id = filters.device_id;
  if (filters.deleted === "active") query.is_deleted = "false";
  if (filters.deleted === "deleted") query.is_deleted = "true";
  return query;
}
function SalesPageManager({
  initialSales,
  clients,
  sellers,
  phones,
  columns
}) {
  const [sales, setSales] = useState(initialSales);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date: "",
    client_id: "",
    seller_id: "",
    device_id: "",
    deleted: "active"
  });
  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.client_id, c.name])),
    [clients]
  );
  const sellerById = useMemo(
    () => new Map(sellers.map((s) => [s.seller_id, s.name])),
    [sellers]
  );
  const phoneById = useMemo(
    () => new Map(phones.map((p) => [p.device_id, p.name])),
    [phones]
  );
  const enrichedSales = useMemo(
    () => sales.map((sale) => ({
      ...sale,
      client_name: clientById.get(sale.client_id) ?? "—",
      seller_name: sellerById.get(sale.seller_id) ?? "—",
      device_name: phoneById.get(sale.device_id) ?? "—"
    })),
    [sales, clientById, sellerById, phoneById]
  );
  const query = useMemo(() => buildQuery(filters), [filters]);
  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const res = await clientApp.sale.all.get({ query });
      setSales(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);
  function clearFilters() {
    setFilters({
      date: "",
      client_id: "",
      seller_id: "",
      device_id: "",
      deleted: "active"
    });
  }
  return /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-6xl rounded-2xl border bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "date",
          value: filters.date,
          onChange: (e) => setFilters((f) => ({ ...f, date: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm"
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filters.client_id,
          onChange: (e) => setFilters((f) => ({ ...f, client_id: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los clientes" }),
            clients.map((c) => /* @__PURE__ */ jsx("option", { value: c.client_id, children: c.name }, c.client_id))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filters.seller_id,
          onChange: (e) => setFilters((f) => ({ ...f, seller_id: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los vendedores" }),
            sellers.map((s) => /* @__PURE__ */ jsx("option", { value: s.seller_id, children: s.name }, s.seller_id))
          ]
        }
      ),
      /* @__PURE__ */ jsxs(
        "select",
        {
          value: filters.device_id,
          onChange: (e) => setFilters((f) => ({ ...f, device_id: e.target.value })),
          className: "rounded-lg border px-3 py-2 text-sm",
          children: [
            /* @__PURE__ */ jsx("option", { value: "", children: "Todos los dispositivos" }),
            phones.map((p) => /* @__PURE__ */ jsx("option", { value: p.device_id, children: p.name }, p.device_id))
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
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "my-4", children: /* @__PURE__ */ jsx(SaleTableManager, { data: enrichedSales, columns }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-gray-600", children: [
        loading ? "Buscando..." : `${sales.length} resultado(s)`,
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
  const [salesRes, clientsRes, sellersRes, phonesRes] = await Promise.all([
    serverApp.sale.all.get(),
    serverApp.client.all.get(),
    serverApp.seller.all.get(),
    serverApp.phone.all.get()
  ]);
  const sales = salesRes.data ?? [];
  const clients = clientsRes.data ?? [];
  const sellers = sellersRes.data ?? [];
  const phones = phonesRes.data ?? [];
  const clientNameById = new Map(
    clients.map((c) => [c.client_id, c.name ?? "\u2014"])
  );
  const sellerNameById = new Map(
    sellers.map((s) => [s.seller_id, s.name ?? "\u2014"])
  );
  const phoneLabelById = new Map(
    phones.map((p) => [
      p.device_id,
      p.name ?? "-"
    ])
  );
  const data = sales.map((sale) => ({
    ...sale,
    client_name: clientNameById.get(sale.client_id) ?? "\u2014",
    seller_name: sellerNameById.get(sale.seller_id) ?? "\u2014",
    device_name: phoneLabelById.get(sale.device_id) ?? "\u2014"
  }));
  console.log("Ventas:", data);
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Ventas" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="w-full text-center text-4xl text-gray-700 font-bold my-5">Ventas</h1> ${renderComponent($$result2, "SalesPageManager", SalesPageManager, { "client:load": true, "initialSales": sales, "clients": clients, "sellers": sellers, "phones": phones, "columns": saleColumns, "client:component-hydration": "load", "client:component-path": "@/components/PageManager/SalePageManager", "client:component-export": "SalesPageManager" })}  <div class="group absolute bottom-10 right-10"> <span class="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-md border bg-white px-4 py-2 
           text-sm font-medium text-black shadow-lg
           opacity-0 scale-95 transition-all duration-200 
           group-hover:opacity-100 group-hover:scale-100
           pointer-events-none">
Nueva Venta
</span> ${renderComponent($$result2, "SheetFormSale", SheetFormSale, { "zIndex": 70, "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/SheetForms/SheetFormSale", "client:component-export": "SheetFormSale" })} </div> `, "tercer-columna": async ($$result2) => renderTemplate`<div class="m-4 mt-20"> ${renderComponent($$result2, "ActionPanel", ActionPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/ActionPanel", "client:component-export": "default" })} </div>` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/sale/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/sale/index.astro";
const $$url = "/sale";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
