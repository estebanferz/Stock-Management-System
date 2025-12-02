import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState } from "react"
import { clientApp } from "@/lib/clientAPI";

interface SheetFormClientProps {
    isOpen?: boolean;
    onClose?: (newClientId?: string) => void;
    zIndex?: number;
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
  
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientID, setClientID] = useState("")

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault()

    const clientData = {
      name: clientName,
      email: clientEmail,
      phone_number: clientPhone,
      id_number: clientID,
    }

    try {
      console.log("Enviando clientData:", clientData);
      const { data: clientResponse, error } = await clientApp.client.post(clientData);
      console.log("Respuesta del servidor:", { clientResponse, error });

      if (error) throw error.value;
      
      const newClientId = clientResponse[0]?.client_id;

      if (onClose) {
        if (newClientId) {
            onClose(String(newClientId)); 
        } else {
            onClose();
        }
      } else {
        window.location.href = "/client"; 
      }
    } catch (err) {
      console.error("Error al cargar cliente:", err);
      if (onClose) onClose();
    }
  }
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
            <Button type="submit" form="form-client">Agregar</Button>
            <SheetClose asChild>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button> 
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



