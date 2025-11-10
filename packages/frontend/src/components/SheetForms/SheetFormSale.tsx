import React from "react"
import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"

export function SheetFormSale() {
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
        <Label htmlFor="sheet-demo-name">Nombre</Label>
        <Input id="sheet-demo-name" defaultValue="Pedro Duarte" />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="sheet-demo-username">Usuario</Label>
        <Input id="sheet-demo-username" defaultValue="@peduarte" />
      </div>
    </CustomSheet>
  )
}
