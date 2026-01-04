import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { clientApp } from "@/lib/clientAPI";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { Provider } from "@server/db/schema"


interface SheetFormProviderProps {
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

export function SheetFormProvider({ isOpen, onClose, zIndex }: SheetFormProviderProps) {

  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = (open: boolean) => {
    if (onClose) {
        if (!open) onClose(); 
    } else {
        setInternalOpen(open); 
    }
  };
  
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    address_st: "",
    address_number: "",
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Provider>) => {
        const row = e.detail;

        setEditingProvider(row);
        const address = row.address ?? "";

        const match = address.match(/^(.*?)(\d+)\s*$/); 
        setForm({
            name: row.name ?? "",
            email: row.email ?? "",
            phone_number: row.phone_number ?? "",
            address_st: match ? match[1].trim() : "",
            address_number: match ? match[2] : "",
        });

        setInternalOpen(true);
    };

    window.addEventListener("open-edit-provider", onEdit as any);
    return () => window.removeEventListener("open-edit-provider", onEdit as any);
  }, []);

const handleSubmitProvider = async (e: React.FormEvent) => {
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
    phone_number: phoneE164,
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

    onClose?.(newProviderId ? String(newProviderId) : undefined);
    window.location.reload();
  } catch (err) {
    console.error(err);
    onClose?.();
  }
};
  const isNested = onClose !== undefined;
  const offsetClass = isNested ? "right-[380px]" : "";

return (
    <form id="form-provider" onSubmit={handleSubmitProvider}>
      <CustomSheet
        title="Agregar Proveedor"
        description="Agregar proveedor al sistema"
        //if nested, add offset for cards ilusion
        className={`${offsetClass}`}
        side="right"
        isOpen={controlledOpen}
        onOpenChange={handleOpenChange}
        isModal={!onClose}
        zIndex={zIndex || (onClose ? 50 : 10)}
        footer={
          <>
            <Button type="submit" form="form-provider">{editingProvider ? "Guardar" : "Agregar"}</Button>
            <SheetClose asChild>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button> 
            </SheetClose>
          </>
        }
      >
        <div className="grid gap-3">
          <Label>Nombre</Label>
          <Input 
            id="name"
            form="form-provider"
            value={form.name} 
            onChange={(e) => setForm({ ...form, name: e.target.value })} 
            required />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input
            id="email"
            form="form-provider"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="example@gmail.com"
          />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input
            id="phone"
            form="form-provider"
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

        <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-3">
                <Label>Calle</Label>
                <Input
                  id="address_st"
                  form="form-provider"
                  value={form.address_st}
                  onChange={(e) => setForm({ ...form, address_st: e.target.value })}
                  required
                />
            </div>
            <div className="grid gap-3">
                <Label>Nro</Label>
                <Input
                  id="address_num"
                  form="form-provider"
                  type="number"
                  value={form.address_number}
                  onChange={(e) => setForm({ ...form, address_number: e.target.value })}
                />
            </div>
        </div>

      </CustomSheet>
    </form>
  )
}