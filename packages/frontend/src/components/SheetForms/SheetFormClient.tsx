import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState } from "react"
import { clientApp } from "@/lib/clientAPI";


export function SheetFormClient() {
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientID, setClientID] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const clientData = {
      name: clientName,
      email: clientEmail,
      phone_number: clientPhone,
      id_number: clientID,
    }

    try {
      console.log("Enviando clientData:", clientData);
      const { data, error } = await clientApp.client.post(clientData);
      console.log("Respuesta del servidor:", { data, error });

      if (error) throw error.value;

      alert("Client successfully created");
      window.location.href = "/client";
    } catch (err) {
      console.error("Error al cargar cliente:", err);
      alert("Error al cargar cliente");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Cliente"
        description="Agregar ciente al sistema"
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
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>DNI</Label>
          <Input
            type="number"
            value={clientID}
            onChange={(e) => setClientID(e.target.value)}
          />
        </div>
      </CustomSheet>
    </form>
  )
}



