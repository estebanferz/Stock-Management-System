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

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

export function SheetFormPhone() {
  const [selectedCategory, setSelectedCategory] = useState("Categroría")
  const [selectedType, setSelectedType] = useState("Categroría")
  const [selectedStorage, setSelectedStorage] = useState("Almacenamiento")
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))
  const [phoneName, setPhoneName] = useState("")
  const [phoneBrand, setPhoneBrand] = useState("")
  const [phoneIMEI, setPhoneIMEI] = useState("")
  const [batteryHealth, setBatteryHealth] = useState("100")
  const [color, setColor] = useState("")
  const [price, setPrice] = useState("0.00")
  const [buyCost, setBuyCost] = useState("0.00")
  const [deposit, setDeposit] = useState("")
  const [sold, setSold] = useState(false)

  const [hasTriggeredExpense, setHasTriggeredExpense] = useState(false);


  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false)
  const handleExpenseFormClose = () => {
    setIsExpenseSheetOpen(false);
  };

  useEffect(() => {
    const cost = parseFloat(buyCost);
    if (cost > 0 && !isExpenseSheetOpen && !hasTriggeredExpense) {
        const timer = setTimeout(() => {
            setIsExpenseSheetOpen(true);
            setHasTriggeredExpense(true);
        }, 350); 
        return () => clearTimeout(timer);

      }
    if (cost <= 0 && hasTriggeredExpense) {
      setHasTriggeredExpense(false);
    }
  }, [buyCost, isExpenseSheetOpen, hasTriggeredExpense]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const datetime = `${date} ${time}:00`;
    const phoneData = {
        datetime: datetime,
        name: phoneName,
        brand: phoneBrand,
        imei: phoneIMEI,
        device_type: selectedType,
        battery_health: Number(batteryHealth),
        storage_capacity: Number(selectedStorage),
        color: color,
        category: selectedCategory,
        price: price,
        buy_cost: buyCost,
        deposit: deposit,
        sold: sold,
    }

    try {
      console.log("Enviando phoneData:", phoneData);
      const { data, error } = await clientApp.phone.post(phoneData);
      console.log("Respuesta del servidor:", { data, error });

      if (error) throw error.value;

      alert("Phone successfully created");
      window.location.href = "/inventory";
    } catch (err) {
      console.error("Error al cargar celular:", err);
      alert("Error al cargar celular");
    }
  }

  const expenseDescription = `Compra de ${phoneBrand} ${phoneName}`.trim();

return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Celular"
        description="Agregar un celular al inventario"
        zIndex={60}
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
          <Label>Marca</Label>
          <Input value={phoneBrand} onChange={(e) => setPhoneBrand(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Modelo</Label>
          <Input value={phoneName} onChange={(e) => setPhoneName(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>IMEI</Label>
          <Input value={phoneIMEI} onChange={(e) => setPhoneIMEI(e.target.value)} required />
        </div>
        
        <div className="grid gap-3">
          <Label>Tipo de producto</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {selectedType} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {productTypes.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setSelectedType(method.value)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Condición Batería</Label>
          <Input type="number" value={batteryHealth} onChange={(e) => setBatteryHealth(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Almacenamiento</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {selectedStorage} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {phoneStorage.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setSelectedStorage(method.value)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Color</Label>
          <Input value={color} onChange={(e) => setColor(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Categoría</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {selectedCategory} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {phoneCategories.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setSelectedCategory(method.value)}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Precio de venta</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>

        <div className="grid gap-3">
            <Label>Costo de compra</Label>
            <Input 
                type="number" 
                value={buyCost} 
                onChange={(e) => setBuyCost(e.target.value)}
                required 
            />
        </div>
        {isExpenseSheetOpen && (
          <SheetFormExpense
              isOpen={isExpenseSheetOpen}
              onClose={handleExpenseFormClose} 
              zIndex={50}
              injectedAmount={buyCost}
              injectedDescription={expenseDescription} 

          />
        )}

        <div className="grid gap-3">
          <Label>Deposito</Label>
          <Input value={deposit} onChange={(e) => setDeposit(e.target.value)} required />
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Vendido</Label>
          <Checkbox checked={sold} onCheckedChange={(checked) => setSold(!!checked)} />
        </div>
      </CustomSheet>
    </form>
  )
}



