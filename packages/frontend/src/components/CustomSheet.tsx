// src/components/CustomSheet.tsx
import React from "react"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface CustomSheetProps {
  /** Título del Sheet */
  title: string
  /** Descripción breve */
  description?: string
  /** Contenido principal (inputs, formularios, etc.) */
  children?: React.ReactNode
  /** Footer personalizado (botones u otras acciones) */
  footer?: React.ReactNode
  /** Ícono o contenido del botón trigger */
  trigger?: React.ReactNode
  /** Clases personalizadas del contenedor del Sheet */
  className?: string
  /** Dirección desde donde se abre el Sheet (right, left, top, bottom) */
  side?: "top" | "right" | "bottom" | "left"
  /** Controla si el Sheet está abierto (para uso controlado) */
  isOpen?: boolean
  /** Función para manejar el cambio de estado (cierre/apertura) */
  onOpenChange?: (open: boolean) => void
  /** Contenido que se renderiza dentro del Sheet (si no se usa children) */
  content?: React.ReactNode // Permite pasar el contenido como prop o como children
}

export function CustomSheet({
  title,
  description,
  children,
  footer,
  trigger,
  className,
  side = "right",
  isOpen,        
  onOpenChange,   
  content,        
}: CustomSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {/* Botón de apertura */}
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button className="flex justify-center items-center h-16 w-16 rounded-full bg-white text-gray-500 hover:bg-mainColor hover:opacity-90 hover:text-white text-3xl shadow-lg">
            +
          </Button>
        )}
      </SheetTrigger>

      {/* Contenido del Sheet */}
      <SheetContent side={side} className={`${className ?? "duration-300"} flex flex-col max-h-[90vh]"`}>
        <SheetHeader className="py-5 my-6">
          <SheetTitle className="font-semibold text-xl">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {/* Contenido dinámico */}
        <div className="grid flex-1 overflow-y-auto auto-rows-min gap-6 mb-10 pl-1 pr-4 py-1">
          {children || content}
        </div>

        {/* Footer dinámico */}
        <SheetFooter>
          {footer ? (
            footer
          ) : (
            <>
              <Button type="submit">Save changes</Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
