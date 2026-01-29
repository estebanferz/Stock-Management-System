// src/components/CustomSheet.tsx
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface CustomSheetProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  trigger?: React.ReactNode;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  isOpen?: boolean;
  isModal?: boolean;
  zIndex?: number;
  onOpenChange?: (open: boolean) => void;
  content?: React.ReactNode;
  onInteractOutside?: (event: any) => void;
  style?: React.CSSProperties;
  showTrigger?: boolean;
  depth?: number; // 0 = root, 1 = primer nested, etc
  isNested?: boolean; // si este sheet está “dentro de otro”
}

function useIsMdUp() {
  const [isMdUp, setIsMdUp] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsMdUp(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isMdUp;
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
  showTrigger = true,
  depth = 0,
  isNested = false,
}: CustomSheetProps) {
  const isMdUp = useIsMdUp();

  // --- offsets ---
  const CARD_OFFSET_PX = 380; // deck md+
  const STACK_OFFSET_PX = 14; // stack sm (separación vertical)

  const rightOffset = isNested && isMdUp ? depth * CARD_OFFSET_PX : 0;
  const stackTranslateY = isNested && !isMdUp ? depth * STACK_OFFSET_PX : 0;

  // --- z-index (para que el nested quede “arriba”) ---
  const BASE_Z = 100;
  const computedZIndex =
    zIndex ?? (isMdUp ? BASE_Z - depth * 2 : BASE_Z + depth * 2);

  return (
    <Sheet modal={isModal} open={isOpen} onOpenChange={onOpenChange}>
      {showTrigger && (
        <SheetTrigger asChild>
          {trigger ? (
            trigger
          ) : (
            <Button className="flex justify-center items-center h-16 w-16 rounded-full bg-white text-gray-500 hover:bg-secondColor hover:opacity-90 hover:text-white text-3xl shadow-lg">
              +
            </Button>
          )}
        </SheetTrigger>
      )}

      <SheetContent
        onInteractOutside={onInteractOutside}
        side={side}
        style={{
          ...(style ?? {}),
          zIndex: computedZIndex,
          right: rightOffset ? `${rightOffset}px` : (style as any)?.right,

          transform:
            stackTranslateY !== 0
              ? `translateY(${stackTranslateY}px)`
              : (style as any)?.transform,
        }}
        className={[
          "flex flex-col max-h-screen",
          "w-screen max-w-none", // mobile full width
          "md:w-[400px] md:max-w-[400px]", // desktop fixed width
          className ?? "duration-300",
        ].join(" ")}
      >
        <SheetHeader className="py-5 my-6">
          <SheetTitle className="font-semibold text-xl">{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        <div className="grid flex-1 overflow-y-auto auto-rows-min gap-6 mb-10 pl-1 pr-4 py-1">
          {children || content}
        </div>

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
  );
}
