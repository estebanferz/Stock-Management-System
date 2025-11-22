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

export function SheetFormExpense() {
  const [selectedMethod, setSelectedMethod] = useState("Pago")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("0.00")
  const [receipt, setReceipt] = useState("")
  const [provider, setProvider] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [time, setTime] = useState(new Date().toISOString().slice(11, 16))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const datetime = new Date(`${date}T${time}`).toISOString();
    const expenseData = {
      datetime: datetime,
      category: category,
      description: description,
      amount: amount,
      payment_method: selectedMethod,
      receipt_number: receipt,
      provider_id: Number(provider),
    }

    try {
      console.log("📤 Enviando saleData:", expenseData);
      const { data, error } = await clientApp.expense.post(expenseData);
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
        title="Agregar gasto"
        description="Agregar gasto de dispositivo al sistema"
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
          <Label>Categoría</Label>
          <Input value={category} onChange={(e) => setCategory(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Descripción</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} required />
        </div>

        <div className="grid gap-3">
            <Label>Monto</Label>
            <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
            />
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

        <div className="grid gap-3">
          <Label>Comprobante</Label>
          <Input value={receipt} onChange={(e) => setReceipt(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Proveedor</Label>
          <Input value={provider} onChange={(e) => setProvider(e.target.value)} required />
        </div>
      </CustomSheet>
    </form>
  )
}



