import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { C as CustomSheet, L as Label, I as Input, B as Button, S as SheetClose } from './TableWrapper_C4p9y2vA.mjs';
import { useState, useEffect } from 'react';
import { c as clientApp } from './formatters_DicF_a8O.mjs';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

function normalizePhoneE164(raw) {
  if (!raw) return null;
  const phone = parsePhoneNumberFromString(raw, "AR");
  if (!phone || !phone.isValid()) return null;
  return phone.format("E.164");
}
function SheetFormClient({ isOpen, onClose, zIndex }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = isOpen !== void 0 ? isOpen : internalOpen;
  const handleOpenChange = (open) => {
    if (onClose) {
      if (!open) onClose();
    } else {
      setInternalOpen(open);
    }
  };
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    id_number: "",
    birth_date: ""
  });
  useEffect(() => {
    const onEdit = (e) => {
      const row = e.detail;
      setEditingClient(row);
      setForm({
        name: row.name ?? "",
        email: row.email ?? "",
        phone_number: row.phone_number ?? "",
        id_number: row.id_number ? String(row.id_number) : "",
        birth_date: row.birth_date ?? ""
      });
      setInternalOpen(true);
    };
    window.addEventListener("open-edit-client", onEdit);
    return () => window.removeEventListener("open-edit-client", onEdit);
  }, []);
  const handleSubmitClient = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const phoneE164 = normalizePhoneE164(form.phone_number);
    if (!phoneE164) {
      alert("El número de teléfono es inválido.");
      return;
    }
    const clientData = {
      ...form,
      phone_number: phoneE164
    };
    try {
      let response;
      if (editingClient) {
        response = await clientApp.client({ id: editingClient.client_id }).put(clientData);
      } else {
        response = await clientApp.client.post(clientData);
      }
      const { data, error } = response;
      if (error) throw error.value;
      const newClientId = data?.[0]?.client_id;
      onClose?.(newClientId ? String(newClientId) : void 0);
      window.location.reload();
    } catch (err) {
      console.error(err);
      onClose?.();
    }
  };
  const isNested = onClose !== void 0;
  const offsetClass = isNested ? "right-[380px]" : "";
  return /* @__PURE__ */ jsx("form", { id: "form-client", onSubmit: handleSubmitClient, children: /* @__PURE__ */ jsxs(
    CustomSheet,
    {
      title: "Agregar Cliente",
      description: "Agregar ciente al sistema",
      className: `${offsetClass}`,
      side: "right",
      isOpen: controlledOpen,
      onOpenChange: handleOpenChange,
      isModal: !onClose,
      zIndex: zIndex || (onClose ? 50 : 10),
      footer: /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(Button, { type: "submit", form: "form-client", children: editingClient ? "Guardar" : "Agregar" }),
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
        /* @__PURE__ */ jsx("div", { className: "grid gap-3", children: /* @__PURE__ */ jsx(
          Input,
          {
            type: "number",
            value: form.id_number,
            onChange: (e) => setForm({ ...form, id_number: e.target.value })
          }
        ) })
      ]
    }
  ) });
}

export { SheetFormClient as S };
