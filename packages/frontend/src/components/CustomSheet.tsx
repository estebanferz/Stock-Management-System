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
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  trigger?: React.ReactNode
  className?: string
  side?: "top" | "right" | "bottom" | "left"
  isOpen?: boolean
  isModal?: boolean //background opacity
  zIndex?: number
  onOpenChange?: (open: boolean) => void
  content?: React.ReactNode 
  onInteractOutside?: (event: any) => void;
  style?: React.CSSProperties;
}

export function CustomSheet({
  title,
  description,
  children,
  footer,
  trigger,
  className,
  side = "right",
  isModal = true,
  isOpen,
  zIndex,        
  onOpenChange,   
  content,    
  onInteractOutside,  
  style,  
}: CustomSheetProps) {
  return (
    <Sheet modal={isModal} open={isOpen} onOpenChange={onOpenChange}>
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
      <SheetContent
        onInteractOutside={onInteractOutside} 
        style={{
          ...(style ?? {}),   // Offset del nesting
          ...(zIndex !== undefined ? { zIndex } : {}), // zIndex manual
        }}    
        side={side} 
        className={`${className ?? "duration-300"} flex flex-col max-h-screen`}
      >
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
