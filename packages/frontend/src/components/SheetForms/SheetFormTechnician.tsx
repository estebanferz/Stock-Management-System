import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { clientApp } from "@/lib/clientAPI";
import { Checkbox } from "@/components/ui/checkbox"
import parsePhoneNumberFromString from "libphonenumber-js"
import type { Technician } from "@server/db/schema"

interface SheetFormTechnicianProps {
  zIndex?: number;
}


function normalizePhoneE164(raw: string): string | null {
  if (!raw) return null;

  const phone = parsePhoneNumberFromString(raw, "AR"); // default AR
  if (!phone || !phone.isValid()) return null;

  return phone.format("E.164"); // +54911...
}


export function SheetFormTechnician({zIndex}:SheetFormTechnicianProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<Technician | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone_number: "",
    speciality: "",
    state: false,
  });
  
  useEffect(() => {
    const onEdit = (e: CustomEvent<Technician>) => {
      const row = e.detail;
  
      setEditingTechnician(row);
  
      setForm({
        name: row.name ?? "",
        email: row.email ? String(row.email) : "",
        phone_number: row.phone_number ?? "",
        speciality: row.speciality ?? "",
        state: row.state === "activo" ? true : false,
      });
  
      setInternalOpen(true);
    };

    const onNew = () => {
      setEditingTechnician(null);

      setForm({
        name: "",
        email: "",
        phone_number: "",
        speciality: "",
        state: false,
      });

      setInternalOpen(true);
    };
  
    window.addEventListener("open-edit-technician", onEdit as any);
    window.addEventListener("open-new-technician", onNew as any);
    return () => {
      window.removeEventListener("open-edit-technician", onEdit as any);
      window.removeEventListener("open-new-technician", onNew as any);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isSubmitting) return;


    let active
    if (form.state){active = "activo"}
    else {active = "inactivo"}

    const technicianData = {
      name: form.name,
      email: form.email,
      phone_number: form.phone_number,
      speciality: form.speciality,
      state: active,
    }

    try {
      setIsSubmitting(true);

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
    } finally {
      setIsSubmitting(false);
    }
  }


return (
    <form id="form-technician" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Técnico"
        zIndex={zIndex}
        isOpen={internalOpen}
        onOpenChange={setInternalOpen}
        description="Agregar técnico al sistema"
        showTrigger={false}
        footer={
          <>
            <Button type="submit" form="form-technician" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : editingTechnician
                  ? "Guardar"
                  : "Agregar"}
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => setInternalOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Label>Nombre</Label>
          <Input 
            id="name"
            form="form-technician"
            value={form.name} 
            onChange={(e) => setForm({...form, name: e.target.value})} 
            required />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input
            id="email"
            form="form-technician"
            type="email" 
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})} 
            placeholder="example@gmail.com"
            />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input
            id="phone"
            form="form-technician"
            value={form.phone_number}
            onChange={(e) => {
              setForm({...form, phone_number: e.target.value.replace(/[^\d+]/g, "")})
            }}
            onBlur={() => {
              const normalized = normalizePhoneE164(form.phone_number);
              if (normalized) setForm({...form, phone_number: normalized})
            }}
            inputMode="tel"
            placeholder="+54 9 11 1234 5678"
            required
          />
        </div>

        <div className="grid gap-3">
          <Label>Especialidad</Label>
          <Input 
            id="speciality"
            form="form-technician"
            value={form.speciality} 
            onChange={(e) => setForm({...form, speciality: e.target.value})} 
            required />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Activo</Label>
          <Checkbox 
            checked={form.state} 
            onCheckedChange={(checked) => setForm({...form, state: !!checked})} />
        </div>

      </CustomSheet>
    </form>
  )
}



