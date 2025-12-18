import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { SheetFormExpense } from './SheetFormExpense';
import { useState, useEffect } from "react"
import { clientApp } from "@/lib/clientAPI";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { phoneCategories } from "../Structures/phoneCategories"
import { productTypes } from "../Structures/productTypes"
import { phoneStorage } from "../Structures/phoneStorage"
import { ChevronDown} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import type { Phone } from "@server/db/schema"

interface SheetFormPhoneProps {
  isOpen?: boolean;
  onClose?: (newPhoneId?: string) => void;
  zIndex?: number;
  depth?: number;
}

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

export function SheetFormPhone({isOpen, onClose, zIndex, depth=0}: SheetFormPhoneProps) {

  const [internalOpen, setInternalOpen] = useState(false);
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = (open: boolean) => {
    if (onClose) {
        if (!open) onClose(); 
        return;
    } else {
        setInternalOpen(open); 
    }
  };

  const [editingPhone, setEditingPhone] = useState<Phone | null>(null);
  const [form, setForm] = useState({
    datetime: "",
    name: "",
    brand: "",
    imei: "",
    device_type: "Tipo",
    battery_health: "",
    storage_capacity: "Almacenamiento",
    color: "",
    category: "Categoria",
    price: "",
    buy_cost: "",
    deposit: "",
    sold: false,
    trade_in: false,
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Phone>) => {
      const row = e.detail;

      setEditingPhone(row);

      // Convert Date → String ISO
      const iso = row.datetime instanceof Date
        ? row.datetime.toISOString()
        : String(row.datetime);

      const [d, t] = iso.split("T");

      setDate(d);                   // YYYY-MM-DD
      setTime(t.slice(0, 5));       // HH:MM

      setForm({
        datetime: String(row.datetime) ?? "",
        name: row.name ?? "",
        brand: row.brand ?? "",
        imei: row.imei ? String(row.imei) : "",
        device_type: row.device_type ?? "",
        battery_health: row.battery_health ? String(row.battery_health) : "",
        storage_capacity: row.storage_capacity ? String(row.storage_capacity) : "",
        color: row.color ?? "",
        category: row.category ?? "",
        price: row.price ?? "",
        buy_cost: row.buy_cost ?? "",
        deposit: row.deposit ?? "",
        sold: row.sold ?? false,
        trade_in: row.trade_in ?? false,
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-phone", onEdit as any);
    return () => window.removeEventListener("open-edit-phone", onEdit as any);
  }, []);
  
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))

  const [hasTriggeredExpense, setHasTriggeredExpense] = useState(false);


  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false)
  const handleExpenseFormClose = () => {
    setIsExpenseSheetOpen(false);
  };

useEffect(() => {
  if (editingPhone) return; // No abrir al editar

  const cost = parseFloat(form.buy_cost);

  if (cost > 0 && !isExpenseSheetOpen && !hasTriggeredExpense) {
    const timer = setTimeout(() => {
      setIsExpenseSheetOpen(true);
      setHasTriggeredExpense(true); // marca que ya se abrió
    }, 400);

    return () => clearTimeout(timer);
  }

  if (cost <= 0) {
    setHasTriggeredExpense(false);
  }
}, [form.buy_cost, isExpenseSheetOpen, hasTriggeredExpense]);



  const handleSubmitPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const datetime = `${date}T${time}:00Z`;
    alert("Submitting phone with datetime:" + datetime);
    const phoneData = {
      ...form,
      datetime: datetime,
      battery_health: Number(form.battery_health),
      storage_capacity: Number(form.storage_capacity),
      trade_in: isNested,
    }

    try {
      let response;

      if (editingPhone) {
        response = await clientApp.phone({ id: editingPhone.device_id }).put(phoneData);
      } else {
        response = await clientApp.phone.post(phoneData);
      }

      const { data, error } = response;
      if (error) throw error.value;
      
      const newPhoneId = data?.[0]?.device_id;

      if (onClose) {
        if (newPhoneId) {
            onClose(String(newPhoneId)); 
        } else {
            onClose();
        }
      }else{
        window.location.reload(); 
      }
    } catch (err) {
      console.error("Error al cargar celular:", err);
      alert("Error al cargar celular");
    }
  }

  const expenseDescription = `Compra de ${form.brand} ${form.name}`.trim();
  const isNested = onClose !== undefined;
  const offset = depth * 380;
  const nextDepth = depth + 1.

return (
  <>
    <form id="form-phone" onSubmit={handleSubmitPhone}>
      <CustomSheet
        title="Agregar Celular"
        description="Agregar un celular al inventario"
        onInteractOutside={(e) => {
          e.preventDefault(); 
        }}
        //if nested, add offset for cards ilusion
        style={isNested ? { right: `${offset}px` } : {}}
        side="right"
        isOpen={controlledOpen}
        onOpenChange={handleOpenChange}
        zIndex={zIndex || (onClose ? 50 : 10)}
        footer={
          <>
            <Button type="submit" form="form-phone">Agregar</Button>
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
          <Label>Marca</Label>
          <Input value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} required />
        </div>

        <div className="grid gap-3">
          <Label>Modelo</Label>
          <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
        </div>

        <div className="grid gap-3">
          <Label>IMEI</Label>
          <Input value={form.imei} onChange={(e) => setForm({...form, imei: e.target.value})} required />
        </div>
        
        <div className="grid gap-3">
          <Label>Tipo de producto</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.device_type} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {productTypes.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, device_type: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Condición Batería</Label>
          <Input type="number" value={form.battery_health} onChange={(e) => setForm({...form, battery_health: e.target.value})} required />
        </div>

        <div className="grid gap-3">
          <Label>Almacenamiento</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.storage_capacity} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {phoneStorage.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, storage_capacity: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Color</Label>
          <Input value={form.color} onChange={(e) => setForm({...form, color: e.target.value})} required />
        </div>

        <div className="grid gap-3">
          <Label>Categoría</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.category} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {phoneCategories.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, category: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Precio de venta</Label>
          <Input type="number" value={form.price} onChange={(e) => setForm({...form, price: e.target.value})} required />
        </div>

        <div className="grid gap-3">
            <Label>Costo de compra</Label>
            <Input 
                type="number" 
                value={form.buy_cost} 
                onChange={(e) => setForm({...form, buy_cost: e.target.value})}
                required 
            />
        </div>

        <div className="grid gap-3">
          <Label>Deposito</Label>
          <Input value={form.deposit} onChange={(e) => setForm({...form, deposit: e.target.value})} required />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Vendido</Label>
          <Checkbox checked={form.sold} onCheckedChange={(checked) => setForm({...form, sold: !!checked})} />
        </div>
      </CustomSheet>
    </form>
    {isExpenseSheetOpen && (
      <SheetFormExpense
          isOpen={isExpenseSheetOpen}
          onClose={handleExpenseFormClose} 
          zIndex={50}
          injectedAmount={form.buy_cost}
          injectedDescription={expenseDescription} 
          depth={nextDepth}
      />
    )}
    </>
  )
}



