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
import { paymentMethods } from "../Structures/paymentMethods"
import { ChevronDown} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { clientApp } from "@/lib/clientAPI";
import { SheetSelector } from './SheetFormSelector'; 


// Función auxiliar para obtener el objeto Date ajustado a la hora local
const getLocalTime = () => {
  const today = new Date();
  // Crea un nuevo Date que, al ser serializado a ISOString, representa la hora local
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

export function SheetFormSale() {
  // Inicialización de fecha y hora usando la corrección de zona horaria
  const initialLocalTime = getLocalTime();
  
  const [selectedMethod, setSelectedMethod] = useState("Pago")
  const [sellerId, setSellerId] = useState("")
  const [clientId, setClientId] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [debt, setDebt] = useState(false)
  const [debtAmount, setDebtAmount] = useState("")
  // Inicialización con la fecha local correcta
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  // Inicialización con la hora local correcta
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))
  const [totalAmount, setTotalAmount] = useState("0.00")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const datetime = new Date(`${date}T${time}`).toISOString();
    
    // Validación básica de IDs
    if (!clientId || !sellerId || !deviceId) {
        alert("Por favor, selecciona Cliente, Vendedor y Dispositivo.");
        return;
    }

    const saleData = {
      datetime,
      debt,
      debt_amount: debt ? debtAmount : null,
      client_id: Number(clientId),
      payment_method: selectedMethod,
      device_id: Number(deviceId),
      total_amount: totalAmount,
      seller_id: Number(sellerId),
    }

    try {
      console.log("📤 Enviando saleData:", saleData);
      const { data, error } = await clientApp.sale.post(saleData);
      console.log("📥 Respuesta del servidor:", { data, error });

      if (error) throw error.value;

      alert("Venta creada exitosamente");
      window.location.href = "/sale";
    } catch (err) {
      console.error("❌ Error al cargar venta:", err);
      alert("Error al cargar venta. Revisa la consola.");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Venta"
        description="Agregar venta de dispositivo al sistema"
        footer={
          <>
            <Button type="submit" form="form-sale">Agregar</Button>
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
          </>
        }
      >
        {/* FECHA Y HORA (AHORA CORRECTAMENTE INICIALIZADAS) */}
        <div className="grid gap-3">
          <Label>Fecha y hora</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        {/* 🚀 VENDEDOR - REEMPLAZADO POR SELECTOR */}
        <div className="grid gap-3">
          <Label>Vendedor</Label>
          <SheetSelector type="seller" currentId={sellerId} onSelect={setSellerId} />
        </div>

        {/* 🚀 CLIENTE - REEMPLAZADO POR SELECTOR */}
        <div className="grid gap-3">
          <Label>Cliente</Label>
          <SheetSelector type="client" currentId={clientId} onSelect={setClientId} />
        </div>

        {/* 🚀 DISPOSITIVO - REEMPLAZADO POR SELECTOR */}
        <div className="grid gap-3">
          <Label>Dispositivo</Label>
          <SheetSelector type="device" currentId={deviceId} onSelect={setDeviceId} />
        </div>

        {/* VALOR */}
        <div className="grid gap-3">
          <Label>Valor</Label>
          <Input 
            value={totalAmount} 
            onChange={(e) => setTotalAmount(e.target.value)} 
            type="number" 
            step="0.01" 
            required 
          />
        </div>

        {/* MÉTODO DE PAGO */}
        <div className="grid gap-3">
          <Label>Método de pago</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {selectedMethod} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {paymentMethods.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setSelectedMethod(method.value)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* DEBE */}
        <div className="flex items-center justify-between gap-3">
          <Label>Debe</Label>
          <Checkbox checked={debt} onCheckedChange={(checked) => setDebt(!!checked)} />
        </div>

        {/* CANTIDAD DE DEUDA (CONDICIONAL) */}
        {debt && (
          <div className="grid gap-3">
            <Label>Cuánto debe</Label>
            <Input
              type="number"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              placeholder="0.00"
              required={debt} // Hace el campo requerido si hay deuda
            />
          </div>
        )}
      </CustomSheet>
    </form>
  )
}