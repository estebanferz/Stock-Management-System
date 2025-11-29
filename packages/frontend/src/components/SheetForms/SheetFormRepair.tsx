import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { repairStates } from "../Structures/repairStates"
import { priorities } from "../Structures/priorities"
import { ChevronDown} from "lucide-react"
import { clientApp } from "@/lib/clientAPI";


export function DateInput() {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];
  const [date, setDate] = useState(local);
  
  return (
    <Input
    id="sheet-sale-date"
    type="date"
    value={date}
    onChange={(e) => setDate(e.target.value)}
    className="border rounded-lg px-3 py-2"
    />
  );
}

export function TimeInput() {
  const today = new Date();
  const local = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .slice(11,16);
  const [time, setTime] = useState(local);
  
  return (
    <Input
    id="sheet-sale-time"
    type="time"
    value={time}
    onChange={(e) => setTime(e.target.value)}
    className="flex justify-center border rounded-lg px-3 py-2"
    />
  );
}

export function SheetFormRepair() {
  const [selectedPriority, setSelectedPriority] = useState("Prioridad")
  const [selectedState, setSelectedState] = useState("Estado")
  const [device, setDevice] = useState("")
  const [client, setClient] = useState("")
  const [technician, setTechnician] = useState("")
  const [repairState, setRepairState] = useState("")
  const [description, setDescription] = useState("")
  const [diagnostic, setDiagnostic] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(new Date().toISOString().slice(11, 16))
  const [clientCost, setClientCost] = useState("0.00")
  const [internalCost, setInternalCost] = useState("0.00")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const datetime = new Date(`${date}T${time}`).toISOString();
    const repairData = {
      datetime: datetime,
      repair_state: selectedState,
      priority: selectedPriority,
      description: description,
      diagnostic: diagnostic,
      client_cost: clientCost,
      internal_cost: internalCost,
      client_id: Number(client),
      technician_id: Number(technician),
      device_id: Number(device),
    }

    try {
      console.log("📤 Enviando repairData:", repairData);
      const { data, error } = await clientApp.repair.post(repairData);
      console.log("📥 Respuesta del servidor:", { data, error });

      if (error) throw error.value;

      alert("Repair successfully created");
      window.location.href = "/repair";
    } catch (err) {
      console.error("❌ Error al cargar reparación:", err);
      alert("Error al cargar reparación");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Reparación"
        description="Agregar reparación de dispositivo al sistema"
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
          <Label>Fecha y hora</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3">
          <Label>Dispositivo</Label>
          <Input value={device} onChange={(e) => setDevice(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Cliente</Label>
          <Input value={client} onChange={(e) => setClient(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Tecnico asignado</Label>
          <Input value={technician} onChange={(e) => setTechnician(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Estado de reparación</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {selectedState} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {repairStates.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setSelectedState(method.value)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Prioridad</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {selectedPriority} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {priorities.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setSelectedPriority(method.value)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Diagnóstico técnico</Label>
          <Input value={diagnostic} onChange={(e) => setDiagnostic(e.target.value)} required />
        </div>

        <div className="grid gap-3">
            <Label>Costo al cliente</Label>
            <Input type="number" value={clientCost} onChange={(e) => setClientCost(e.target.value)} />
        </div>

        <div className="grid gap-3">
            <Label>Costo interno</Label>
            <Input type="number" value={internalCost} onChange={(e) => setInternalCost(e.target.value)} />
        </div>
      </CustomSheet>
    </form>
  )
}



