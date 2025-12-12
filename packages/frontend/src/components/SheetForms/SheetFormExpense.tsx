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
import type { Expense } from "@server/db/schema"


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
    depth?: number;
}

export function SheetFormExpense({ isOpen, onClose, zIndex, injectedAmount, injectedDescription, depth=0 }: SheetFormExpenseProps) {
  const initialLocalTime = getLocalTime()
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))

  const [internalOpen, setInternalOpen] = useState(false) //Only used when not nested
  const isNested = onClose !== undefined
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    datetime: "",
    category: isNested ? "Producto" : "",
    description: "",
    amount: `${injectedAmount || ""}`,
    payment_method: "Pago",
    receipt_number: "",
    provider_id: "",
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Expense>) => {
      const row = e.detail;

      setEditingExpense(row);

      // Convert Date → String ISO
      const iso = row.datetime instanceof Date
        ? row.datetime.toISOString()
        : String(row.datetime);

      const [d, t] = iso.split("T");

      setDate(d);                   // YYYY-MM-DD
      setTime(t.slice(0, 5));       // HH:MM

      setForm({
        datetime: String(row.datetime) ?? "",
        category: row.category ?? "",
        description: row.description ?? "",
        amount: row.amount ?? "",
        payment_method: row.payment_method ?? "",
        receipt_number: row.receipt_number ?? "",
        provider_id: String(row.provider_id) ?? "",
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-expense", onEdit as any);
    return () => window.removeEventListener("open-edit-expense", onEdit as any);
  }, []);

  useEffect(() => {
    if (injectedAmount) {
      setForm({...form, amount: injectedAmount});    }
  }, [injectedAmount]);

  useEffect(() => {
    if (injectedDescription) {
      setForm({...form, description: injectedDescription});
    }
  }, [injectedDescription]);

  const handleOpenChange = (open: boolean) => {
      if (onClose) {
          if (!open) onClose()
          return;
      } else {
          setInternalOpen(open)
      }
  }

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation();

    const datetime = `${date}T${time}:00Z`;
    const expenseData = {
      ...form,
      datetime: datetime,
      provider_id: Number(form.provider_id),
    }

    try {
      let response;

      if (editingExpense) {
        response = await clientApp.expense({ id: editingExpense.expense_id }).put(expenseData);
      } else {
        response = await clientApp.expense.post(expenseData);
      }
      const { data, error } = response

      if (error) throw error.value
      
      if (isNested) {
          onClose!(); 
      }else{
        window.location.href = "/expense"; 
      }
    } catch (err) {
      console.error("❌ Error al cargar venta:", err)
      alert("Error al cargar venta")
      if (isNested) onClose!(); 

    }
  }
  
  const offset = depth * 380;
  const handlePropagationStop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };


return (
    <form id="form-expense" onSubmit={handleSubmitExpense}>
      <CustomSheet
        title="Agregar Gasto"
        description="Agregar gasto de dispositivo al sistema"
        onInteractOutside={(e) => {
          e.preventDefault(); 
        }}
        //Props if nested
        style={isNested ? { right: `${offset}px` } : {}}
        side={"right"}
        isOpen={controlledOpen}
        onOpenChange={handleOpenChange} 
        zIndex={zIndex || 10} // Z-index
        
        footer={
          <>
            <Button type="submit" form="form-expense" onClick={handlePropagationStop}>{editingExpense ? "Guardar" : "Agregar"}</Button>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
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
          <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        </div>

        <div className="grid gap-3">
          <Label>Descripción</Label>
          <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>

        <div className="grid gap-3">
            <Label>Monto</Label>
            <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
            />
        </div>

        <div className="grid gap-3">
          <Label>Método de pago</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.payment_method} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {paymentMethods.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({ ...form, payment_method: method.value })}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Comprobante</Label>
          <Input value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} required />
        </div>

        <div className="grid gap-3">
          <Label>Proveedor</Label>
          <SheetSelector type="provider" currentId={form.provider_id} onSelect={(id) => setForm({ ...form, provider_id: id })} />
        </div>
      </CustomSheet>
    </form>
  )
}



