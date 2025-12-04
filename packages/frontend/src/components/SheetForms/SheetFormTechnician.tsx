import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState } from "react"
import { clientApp } from "@/lib/clientAPI";
import { Checkbox } from "@/components/ui/checkbox"
import parsePhoneNumberFromString from "libphonenumber-js"

function normalizePhoneE164(raw: string): string | null {
  if (!raw) return null;

  const phone = parsePhoneNumberFromString(raw, "AR"); // default AR
  if (!phone || !phone.isValid()) return null;

  return phone.format("E.164"); // +54911...
}

export function SheetFormTechnician() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [speciality, setSpeciality] = useState("")
  const [state, setState] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let active
    if (state){active = "activo"}
    else {active = "inactivo"}

    const technicianData = {
      name: name,
      email: email,
      phone_number: phoneNumber,
      speciality: speciality,
      state: active,
    }

    try {
      console.log("Enviando clientData:", technicianData);
      const { data, error } = await clientApp.technician.post(technicianData);
      console.log("Respuesta del servidor:", { data, error });

      if (error) throw error.value;

      alert("Technician successfully created");
      window.location.href = "/technician";
    } catch (err) {
      console.error("Error al cargar tecnico:", err);
      alert("Error al cargar tecnico");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Técnico"
        description="Agregar técnico al sistema"
        footer={
          <>
            <Button type="submit" form="form-sale">Agregar</Button>
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
          </>
        }
      >
        <div className="grid gap-3">
          <Label>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value.replace(/[^\d+]/g, ""));
            }}
            onBlur={() => {
              const normalized = normalizePhoneE164(phoneNumber);
              if (normalized) setPhoneNumber(normalized);
            }}
            inputMode="tel"
            placeholder="+54 9 11 1234 5678"
            required
          />
        </div>

        <div className="grid gap-3">
          <Label>Especialidad</Label>
          <Input value={speciality} onChange={(e) => setSpeciality(e.target.value)} required />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Activo</Label>
          <Checkbox checked={state} onCheckedChange={(checked) => setState(!!checked)} />
        </div>

      </CustomSheet>
    </form>
  )
}



