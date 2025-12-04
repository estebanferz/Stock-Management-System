import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { SheetSelector } from "@/components/SheetForms/SheetSelector"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { paymentMethods } from "../Structures/paymentMethods"
import { ChevronDown} from "lucide-react"
import { clientApp } from "@/lib/clientAPI";


const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

interface SheetFormExpenseProps {
    isOpen?: boolean; //optional, nested mode
    onClose?: () => void; // optional, nested mode
    zIndex?: number; // optional, nested mode
    injectedAmount?: string;
    injectedDescription?: string;
}

export function SheetFormExpense({ isOpen, onClose, zIndex, injectedAmount, injectedDescription }: SheetFormExpenseProps) {
  const [selectedMethod, setSelectedMethod] = useState("Pago")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState(injectedDescription || "")
  const [amount, setAmount] = useState(injectedAmount || "0.00")
  const [receipt, setReceipt] = useState("")
  const [provider, setProvider] = useState("")
  const initialLocalTime = getLocalTime()
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))

  const [internalOpen, setInternalOpen] = useState(false) //Only used when not nested
  const isNested = onClose !== undefined
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen

  useEffect(() => {
    if (injectedAmount) {
      setAmount(injectedAmount);
    }
  }, [injectedAmount]);

  useEffect(() => {
    if (injectedDescription) {
      setDescription(injectedDescription);
    }
  }, [injectedDescription]);

  const handleOpenChange = (open: boolean) => {
      if (onClose) {
          if (!open) onClose()
      } else {
          setInternalOpen(open)
      }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation();

    const datetime = `${date} ${time}:00`;
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
      console.log("📤 Enviando saleData:", expenseData)
      const { data, error } = await clientApp.expense.post(expenseData)
      console.log("📥 Respuesta del servidor:", { data, error })

      if (error) throw error.value
      

      if (isNested) {
          alert("Gasto creado exitosamente.");
          onClose!(); 
      } else {
          alert("Gasto creado exitosamente.");
          window.location.href = "/expense";
      }

    } catch (err) {
      console.error("❌ Error al cargar venta:", err)
      alert("Error al cargar venta")
      if (isNested) onClose!(); 

    }
  }
  
  const offsetClass = isNested ? "right-[380px]" : "";

  const handlePropagationStop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };


return (
    <form id="form-expense" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Gasto"
        description="Agregar gasto de dispositivo al sistema"
        onInteractOutside={(e) => {
          e.preventDefault(); 
        }}
        //Props if nested
        className={`${offsetClass}`} //Offset
        side={"right"}
        isOpen={controlledOpen}
        onOpenChange={handleOpenChange} 
        isModal={!isNested} // ModalProp if not nested
        zIndex={zIndex || 10} // Z-index
        
        footer={
          <>
            <Button type="submit" form="form-expense" onClick={handlePropagationStop}>Agregar</Button>
            <SheetClose asChild>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
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
                <DropdownMenuItem key={method.value} onClick={() => setSelectedMethod(method.value)}>
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
          <Label>Vendedor</Label>
          <SheetSelector type="provider" currentId={provider} onSelect={setProvider} />
        </div>
      </CustomSheet>
    </form>
  )
}



