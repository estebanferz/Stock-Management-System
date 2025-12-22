import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { C as CustomSheet, L as Label, I as Input, B as Button } from './TableWrapper_C4p9y2vA.mjs';
import { useState, useEffect } from 'react';
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, c as DropdownMenuItem, S as SheetSelector } from './dropdown-menu_p3DDvNeO.mjs';
import { ChevronDown } from 'lucide-react';
import { c as clientApp } from './formatters_DicF_a8O.mjs';

const paymentMethods = [
  { value: "transferencia", label: "Transferencia" },
  { value: "efectivo-usd", label: "Efectivo USD" },
  { value: "efectivo-ars", label: "Efectivo ARS" },
  { value: "crypto", label: "Crypto" }
];

const getLocalTime = () => {
  const today = /* @__PURE__ */ new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 6e4);
};
function SheetFormExpense({ isOpen, onClose, zIndex, injectedAmount, injectedDescription, depth = 0 }) {
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16));
  const [receiptFile, setReceiptFile] = useState(void 0);
  const [internalOpen, setInternalOpen] = useState(false);
  const isNested = onClose !== void 0;
  const controlledOpen = isOpen !== void 0 ? isOpen : internalOpen;
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState({
    category: isNested ? "Producto" : "",
    description: "",
    amount: `${injectedAmount || ""}`,
    payment_method: "Pago",
    provider_id: ""
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingExpense(row);
      const iso = row.datetime instanceof Date ? row.datetime.toISOString() : String(row.datetime);
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));
      setForm({
        category: row.category ?? "",
        description: row.description ?? "",
        amount: row.amount ?? "",
        payment_method: row.payment_method ?? "",
        provider_id: String(row.provider_id) ?? ""
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-expense", onEdit);
    return () => window.removeEventListener("open-edit-expense", onEdit);
  }, []);
  useEffect(() => {
    if (injectedAmount) {
      setForm({ ...form, amount: injectedAmount });
    }
  }, [injectedAmount]);
  useEffect(() => {
    if (injectedDescription) {
      setForm({ ...form, description: injectedDescription });
    }
  }, [injectedDescription]);
  const handleOpenChange = (open) => {
    if (onClose) {
      if (!open) onClose();
      return;
    } else {
      setInternalOpen(open);
    }
    if (!open && !isNested) {
      setEditingExpense(null);
      setReceiptFile(void 0);
      setForm({
        category: isNested ? "Producto" : "",
        description: "",
        amount: "",
        payment_method: "Pago",
        provider_id: ""
      });
      const newLocalTime = getLocalTime();
      setDate(newLocalTime.toISOString().split("T")[0]);
      setTime(newLocalTime.toISOString().slice(11, 16));
    }
  };
  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const datetime = `${date}T${time}:00Z`;
    const expenseData = {
      ...form,
      datetime,
      provider_id: form.provider_id ? Number(form.provider_id) : null,
      receipt: receiptFile
    };
    try {
      let response;
      if (editingExpense) {
        response = await clientApp.expense({ id: editingExpense.expense_id }).put(expenseData);
      } else {
        response = await clientApp.expense.post(expenseData);
      }
      const { error } = response;
      if (error) throw error.value;
      if (isNested) {
        onClose();
      } else {
        window.location.href = "/expense";
      }
    } catch (err) {
      console.error("❌ Error al cargar gasto:", err);
      alert("Error al cargar gasto");
      if (isNested) onClose();
    }
  };
  const offset = depth * 380;
  const handlePropagationStop = (e) => {
    e.stopPropagation();
  };
  return /* @__PURE__ */ jsx("form", { id: "form-expense", onSubmit: handleSubmitExpense, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      title: "Agregar Gasto",
      description: "Agregar gasto de dispositivo al sistema",
      onInteractOutside: (e) => {
        e.preventDefault();
      },
      style: isNested ? { right: `${offset}px` } : {},
      side: "right",
      isOpen: controlledOpen,
      onOpenChange: handleOpenChange,
      zIndex: zIndex || 10,
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-expense", onClick: handlePropagationStop, children: editingExpense ? "Guardar" : "Agregar" }),
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
          /* @__PURE__ */ jsx(Label, { children: "Categoría" }),
          /* @__PURE__ */ jsx(Input, { value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Descripción" }),
          /* @__PURE__ */ jsx(Input, { value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), required: true })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Monto" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "number",
              value: form.amount,
              onChange: (e) => setForm({ ...form, amount: e.target.value }),
              placeholder: "0.00"
            }
          )
        ] }),
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
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Comprobante" }),
          /* @__PURE__ */ jsx(
            Input,
            {
              type: "file",
              accept: "image/*,application/pdf",
              onChange: (e) => {
                const file = e.target.files?.[0];
                setReceiptFile(file);
              }
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
          /* @__PURE__ */ jsx(Label, { children: "Proveedor" }),
          /* @__PURE__ */ jsx(SheetSelector, { depth: isNested ? depth : 1, type: "provider", currentId: form.provider_id, onSelect: (id) => setForm({ ...form, provider_id: id ?? "" }) })
        ] })
      ]
    }
  ) });
}

export { SheetFormExpense as S, paymentMethods as p };
