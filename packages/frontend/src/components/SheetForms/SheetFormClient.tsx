import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { clientApp } from "@/lib/clientAPI";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { Client } from "@server/db/schema"


interface SheetFormClientProps {
  isOpen?: boolean;
  onClose?: (newClientId?: string) => void;
  zIndex?: number;
}

function normalizePhoneE164(raw: string): string | null {
  if (!raw) return null;

  const phone = parsePhoneNumberFromString(raw, "AR"); // default AR
  if (!phone || !phone.isValid()) return null;

  return phone.format("E.164"); // +54911...
}

export function SheetFormClient({ isOpen, onClose, zIndex }: SheetFormClientProps) {

  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = (open: boolean) => {
    if (onClose) {
        if (!open) onClose(); 
    } else {
        setInternalOpen(open); 
    }
  };
  
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    id_number: "",
    birth_date: "",
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Client>) => {
      const row = e.detail;

      setEditingClient(row);

      setForm({
        name: row.name ?? "",
        email: row.email ?? "",
        phone_number: row.phone_number ?? "",
        id_number: row.id_number ? String(row.id_number) : "",
        birth_date: row.birth_date ?? "",
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-client", onEdit as any);
    return () => window.removeEventListener("open-edit-client", onEdit as any);
  }, []);

const handleSubmitClient = async (e: React.FormEvent) => {
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

    onClose?.(newClientId ? String(newClientId) : undefined);
    window.location.reload();
  } catch (err) {
    console.error(err);
    onClose?.();
  }
};
  const isNested = onClose !== undefined;
  const offsetClass = isNested ? "right-[380px]" : "";

return (
    <form id="form-client" onSubmit={handleSubmitClient}>
      <CustomSheet
        title="Agregar Cliente"
        description="Agregar ciente al sistema"
        //if nested, add offset for cards ilusion
        className={`${offsetClass}`}
        side="right"
        isOpen={controlledOpen}
        onOpenChange={handleOpenChange}
        isModal={!onClose}
        zIndex={zIndex || (onClose ? 50 : 10)}
        footer={
          <>
            <Button type="submit" form="form-client">{editingClient ? "Guardar" : "Agregar"}</Button>
            <SheetClose asChild>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button> 
            </SheetClose>
          </>
        }
      >
        <div className="grid gap-3">
          <Label>Nombre</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input
            value={form.phone_number}
            onChange={(e) =>
              setForm({
                ...form,
                phone_number: e.target.value.replace(/[^\d+]/g, "")
              })
            }
            onBlur={() => {
              const normalized = normalizePhoneE164(form.phone_number);
              if (normalized) setForm({ ...form, phone_number: normalized });
            }}
            inputMode="tel"
            placeholder="+54 9 11 1234 5678"
            required
          />
        </div>

        <div className="grid gap-3">
        <Input
          type="number"
          value={form.id_number}
          onChange={(e) => setForm({ ...form, id_number: e.target.value })}
        />
        </div>
      </CustomSheet>
    </form>
  )
}



