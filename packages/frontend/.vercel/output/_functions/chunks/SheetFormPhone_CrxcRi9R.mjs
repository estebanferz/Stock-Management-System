import { jsxs, Fragment, jsx } from 'react/jsx-runtime';
import { C as CustomSheet, L as Label, I as Input, B as Button } from './TableWrapper_C4p9y2vA.mjs';
import { S as SheetFormExpense } from './SheetFormExpense_D5hzPyyW.mjs';
import { useState, useEffect } from 'react';
import { c as clientApp } from './formatters_DicF_a8O.mjs';
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem } from './dropdown-menu_p3DDvNeO.mjs';
import { ChevronDown } from 'lucide-react';
import { C as Checkbox } from './checkbox_BMTKeZ0q.mjs';

const phoneCategories = [
  { value: "as-is", label: "As is" },
  { value: "sellado", label: "Sellado" },
  { value: "usado", label: "Usado" }
];

const productTypes = [
  { value: "just-one", label: "Unitario" },
  { value: "with-stock", label: "Con stock" }
];

const phoneStorage = [
  { value: "64", label: "64 GB" },
  { value: "128", label: "128 GB" },
  { value: "256", label: "256 GB" },
  { value: "512", label: "512 GB" },
  { value: "1024", label: "1 TB" }
];

const getLocalTime = () => {
  const today = /* @__PURE__ */ new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 6e4);
};
function SheetFormPhone({ isOpen, onClose, zIndex, depth = 0 }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = isOpen !== void 0 ? isOpen : internalOpen;
  const handleOpenChange = (open) => {
    if (onClose) {
      if (!open) onClose();
      return;
    } else {
      setInternalOpen(open);
    }
  };
  const [editingPhone, setEditingPhone] = useState(null);
  const [form, setForm] = useState({
    datetime: "",
    name: "",
    brand: "",
    imei: "",
    device_type: "Tipo",
    battery_health: "",
    storage_capacity: "Almacenamiento",
    color: "",
    category: "Categoria",
    price: "",
    buy_cost: "",
    deposit: "",
    sold: false,
    trade_in: false
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingPhone(row);
      const iso = row.datetime instanceof Date ? row.datetime.toISOString() : String(row.datetime);
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));
      setForm({
        datetime: String(row.datetime) ?? "",
        name: row.name ?? "",
        brand: row.brand ?? "",
        imei: row.imei ? String(row.imei) : "",
        device_type: row.device_type ?? "",
        battery_health: row.battery_health ? String(row.battery_health) : "",
        storage_capacity: row.storage_capacity ? String(row.storage_capacity) : "",
        color: row.color ?? "",
        category: row.category ?? "",
        price: row.price ?? "",
        buy_cost: row.buy_cost ?? "",
        deposit: row.deposit ?? "",
        sold: row.sold ?? false,
        trade_in: row.trade_in ?? false
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-phone", onEdit);
    return () => window.removeEventListener("open-edit-phone", onEdit);
  }, []);
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16));
  const [hasTriggeredExpense, setHasTriggeredExpense] = useState(false);
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const handleExpenseFormClose = () => {
    setIsExpenseSheetOpen(false);
  };
  useEffect(() => {
    if (editingPhone) return;
    const cost = parseFloat(form.buy_cost);
    if (cost > 0 && !isExpenseSheetOpen && !hasTriggeredExpense) {
      const timer = setTimeout(() => {
        setIsExpenseSheetOpen(true);
        setHasTriggeredExpense(true);
      }, 400);
      return () => clearTimeout(timer);
    }
    if (cost <= 0) {
      setHasTriggeredExpense(false);
    }
  }, [form.buy_cost, isExpenseSheetOpen, hasTriggeredExpense]);
  const handleSubmitPhone = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const datetime = `${date}T${time}:00Z`;
    alert("Submitting phone with datetime:" + datetime);
    const phoneData = {
      ...form,
      datetime,
      battery_health: Number(form.battery_health),
      storage_capacity: Number(form.storage_capacity),
      trade_in: isNested
    };
    try {
      let response;
      if (editingPhone) {
        response = await clientApp.phone({ id: editingPhone.device_id }).put(phoneData);
      } else {
        response = await clientApp.phone.post(phoneData);
      }
      const { data, error } = response;
      if (error) throw error.value;
      const newPhoneId = data?.[0]?.device_id;
      if (onClose) {
        if (newPhoneId) {
          onClose(String(newPhoneId));
        } else {
          onClose();
        }
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error al cargar celular:", err);
      alert("Error al cargar celular");
    }
  };
  const expenseDescription = `Compra de ${form.brand} ${form.name}`.trim();
  const isNested = onClose !== void 0;
  const offset = depth * 380;
  const nextDepth = depth + 1;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("form", { id: "form-phone", onSubmit: handleSubmitPhone, children: /* @__PURE__ */ jsxs(
      CustomSheet,
      {
        title: "Agregar Celular",
        description: "Agregar un celular al inventario",
        onInteractOutside: (e) => {
          e.preventDefault();
        },
        style: isNested ? { right: `${offset}px` } : {},
        side: "right",
        isOpen: controlledOpen,
        onOpenChange: handleOpenChange,
        zIndex: zIndex || (onClose ? 50 : 10),
        footer: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-phone", children: "Agregar" }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => handleOpenChange(false), children: "Cancelar" })
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
            /* @__PURE__ */ jsx(Label, { children: "Marca" }),
            /* @__PURE__ */ jsx(Input, { value: form.brand, onChange: (e) => setForm({ ...form, brand: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Modelo" }),
            /* @__PURE__ */ jsx(Input, { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "IMEI" }),
            /* @__PURE__ */ jsx(Input, { value: form.imei, onChange: (e) => setForm({ ...form, imei: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Tipo de producto" }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto w-full justify-between font-normal", children: [
                form.device_type,
                " ",
                /* @__PURE__ */ jsx(ChevronDown, {})
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: productTypes.map((method) => /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setForm({ ...form, device_type: method.value }), children: method.label }, method.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Condición Batería" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: form.battery_health, onChange: (e) => setForm({ ...form, battery_health: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Almacenamiento" }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto w-full justify-between font-normal", children: [
                form.storage_capacity,
                " ",
                /* @__PURE__ */ jsx(ChevronDown, {})
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: phoneStorage.map((method) => /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setForm({ ...form, storage_capacity: method.value }), children: method.label }, method.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Color" }),
            /* @__PURE__ */ jsx(Input, { value: form.color, onChange: (e) => setForm({ ...form, color: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Categoría" }),
            /* @__PURE__ */ jsxs(DropdownMenu, { children: [
              /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "outline", className: "ml-auto w-full justify-between font-normal", children: [
                form.category,
                " ",
                /* @__PURE__ */ jsx(ChevronDown, {})
              ] }) }),
              /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: phoneCategories.map((method) => /* @__PURE__ */ jsx(DropdownMenuItem, { onClick: () => setForm({ ...form, category: method.value }), children: method.label }, method.value)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Precio de venta" }),
            /* @__PURE__ */ jsx(Input, { type: "number", value: form.price, onChange: (e) => setForm({ ...form, price: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Costo de compra" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                type: "number",
                value: form.buy_cost,
                onChange: (e) => setForm({ ...form, buy_cost: e.target.value }),
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Deposito" }),
            /* @__PURE__ */ jsx(Input, { value: form.deposit, onChange: (e) => setForm({ ...form, deposit: e.target.value }), required: true })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsx(Label, { children: "Vendido" }),
            /* @__PURE__ */ jsx(Checkbox, { checked: form.sold, onCheckedChange: (checked) => setForm({ ...form, sold: !!checked }) })
          ] })
        ]
      }
    ) }),
    isExpenseSheetOpen && /* @__PURE__ */ jsx(
      SheetFormExpense,
      {
        isOpen: isExpenseSheetOpen,
        onClose: handleExpenseFormClose,
        zIndex: 50,
        injectedAmount: form.buy_cost,
        injectedDescription: expenseDescription,
        depth: nextDepth
      }
    )
  ] });
}

export { SheetFormPhone as S, productTypes as a, phoneCategories as p };
