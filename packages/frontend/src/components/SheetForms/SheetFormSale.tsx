import React from "react"
import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { paymentMethods } from "../Structures/paymentMethods"
import { ChevronDown} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"




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
  const [selectedMethod, setSelectedMethod] = useState("Pago");

  return (
    <CustomSheet
      title="Agregar venta"
      description="Agregar venta de dispositivo al sistema"
      footer={
        <>
          <Button type="submit">Save changes</Button>
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </>
      }
    >
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Fecha y hora</Label>
        <div className="grid grid-cols-2 gap-2">
          {DateInput()}
          {TimeInput()}
        </div>
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-name">Vendedor</Label>              
        <Input id="sheet-demo-name" defaultValue="buscar Vendedores en DB" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Cliente</Label>
        <Input id="sheet-demo-username" defaultValue="Buscar clientes en DB, BOTON para agregar" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Dispositivo</Label>
        <Input id="sheet-demo-username" defaultValue="Buscar dispositivos por IMEI" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Etiqueta de venta</Label>
        <Input id="sheet-demo-username" defaultValue="Mayorista, minorista, tipo string" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-sale-paymentmethod">Metodo de pago</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto w-full justify-between font-normal">
              {selectedMethod} <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {paymentMethods.map((method) => (
              <DropdownMenuItem
                key={method.value}
                className="capitalize"
                checked={selectedMethod === method.label}
                onClick={() => setSelectedMethod(method.label)}
              >
                {method.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Comprobante de pago</Label>
        <Input id="sheet-demo-username" defaultValue="Subir archivo" />
      </div>
      <div className="flex justify-between gap-3">
        <Label htmlFor="sheet-sale-debt">Debe</Label>
        <Checkbox id="sheet-sale-debt" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Cuanto debe:</Label>
        <Input id="sheet-sale-debtamount" defaultValue="Agregar monto" />
      </div>
    </CustomSheet>
  )
}
