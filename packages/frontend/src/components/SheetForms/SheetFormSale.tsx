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

export function SheetFormSale() {
  const [selectedMethod, setSelectedMethod] = useState("Pago")
  const [sellerId, setSellerId] = useState("")
  const [clientId, setClientId] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [debt, setDebt] = useState(false)
  const [debtAmount, setDebtAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(new Date().toISOString().slice(11, 16))
  const [totalAmount, setTotalAmount] = useState("0.00")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const datetime = new Date(`${date}T${time}`).toISOString();
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

      alert("Sale successfully created");
      window.location.href = "/sale";
    } catch (err) {
      console.error("❌ Error al cargar venta:", err);
      alert("Error al cargar venta");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar venta"
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
        <div className="grid gap-3">
          <Label>Fecha y hora</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3">
          <Label>Vendedor</Label>
          <Input value={sellerId} onChange={(e) => setSellerId(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Cliente</Label>
          <Input value={clientId} onChange={(e) => setClientId(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Dispositivo</Label>
          <Input value={deviceId} onChange={(e) => setDeviceId(e.target.value)} required />
        </div>

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
                <DropdownMenuItem key={method.value} onClick={() => setSelectedMethod(method.label)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Debe</Label>
          <Checkbox checked={debt} onCheckedChange={(checked) => setDebt(!!checked)} />
        </div>

        {debt && (
          <div className="grid gap-3">
            <Label>Cuánto debe</Label>
            <Input
              type="number"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}
      </CustomSheet>
    </form>
  )
}



