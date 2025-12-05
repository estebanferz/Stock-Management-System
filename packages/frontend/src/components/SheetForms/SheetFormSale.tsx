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
import { Checkbox } from "@/components/ui/checkbox"
import { clientApp } from "@/lib/clientAPI";
import { SheetSelector } from './SheetSelector'; 
import { SheetFormClient } from './SheetFormClient';
import { SheetFormPhone } from "./SheetFormPhone"

interface SheetFormSaleProps {
  zIndex?: number;
}

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

export function SheetFormSale({zIndex}:SheetFormSaleProps) {
  
  const [selectedMethod, setSelectedMethod] = useState("Pago")
  const [sellerId, setSellerId] = useState("")
  const [clientId, setClientId] = useState("")
  const [deviceId, setDeviceId] = useState("")
  const [debt, setDebt] = useState(false)
  const [debtAmount, setDebtAmount] = useState("")
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))
  const [totalAmount, setTotalAmount] = useState("0.00")
  
  // Control opening of SheetFormClient
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false);
  // Control opening of SheetFormPhone
  const [isPhoneSheetOpen, setIsPhoneSheetOpen] = useState(false);

  const handleDeviceSelect = (id: string, price?: string) => {
    setDeviceId(id)
    if (price) {
      setTotalAmount(String(price)); 
    }
  };
  const handleAddTradeInPhone = () => {
    setIsPhoneSheetOpen(true);
  };
  const handlePhoneFormClose = (newPhoneId?: string) => {
    setIsPhoneSheetOpen(false);
    
    if (newPhoneId) {
      setDeviceId(newPhoneId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const datetime = `${date}T${time}:00Z`;
    
    if (!clientId || !sellerId || !deviceId) {
        alert("Por favor, selecciona Cliente, Vendedor y Dispositivo.");
        return;
    }

    const saleData = {
      datetime,
      debt,
      debt_amount: debt ? debtAmount : null,
      client_id: Number(clientId),
      payment_method: selectedMethod,
      device_id: Number(deviceId),
      total_amount: totalAmount,
      seller_id: Number(sellerId),
    }

    try {
      const { data, error } = await clientApp.sale.post(saleData);
      console.log("server response:", { data, error });

      if (error) throw error.value;


      const deviceIdNumber = Number(deviceId);      
      const phoneFetcher = clientApp.phone;
      const { data: currentPhoneData, error: getError } = 
        await (phoneFetcher as any)({ id: deviceIdNumber }).get();

      console.log(currentPhoneData)
      if (getError || !currentPhoneData) {
        alert("Venta registrada, pero falló la actualización del estado del dispositivo (No encontrado o error GET).");
        window.location.href = "/sale";
        return;
      }
      
      const updatePayload = {
        ...currentPhoneData,
        sold: true,
      };
      delete updatePayload.datetime;

      console.log(`🛠️ Enviando actualización de estado (sold: true)...`);
      const phoneUpdater = clientApp.phone;
      const { error: phoneUpdateError } = 
        await (phoneUpdater as any)({ id: deviceIdNumber }).put(updatePayload);      
      if (phoneUpdateError) {
        console.error("⚠️ Falló la actualización final del dispositivo:", phoneUpdateError.value);
        alert("Venta registrada, pero falló la actualización del estado del dispositivo (Error PUT).");
      } else {
        console.log("✅ Dispositivo marcado como vendido.");
      }

      alert("Venta creada exitosamente y dispositivo marcado como vendido.");
      window.location.href = "/sale";

    } catch (err) {
      console.error("❌ Error al cargar venta:", err);
      alert("Error al cargar venta. Revisa la consola.");
    }
  }
  

  // SheetFormClient Opening Function
  const handleAddClient = () => {
      setIsClientSheetOpen(true);
  };

  // Function for closing SheetFormClient and retrieving the client_id
  const handleClientFormClose = (newClientId?: string) => {
      setIsClientSheetOpen(false); // Closes Sheet
      
      // If ID provided, updates state of clientId
      if (newClientId) {
          setClientId(newClientId); 
      }
  };


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        className="w-[400px] duration-300 flex flex-col"
        title="Agregar Venta"
        zIndex={zIndex}
        description="Agregar venta de dispositivo al sistema"
        isModal={true}
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
          <Label>Vendedor</Label>
          <SheetSelector type="seller" currentId={sellerId} onSelect={setSellerId} />
        </div>

        <div className="grid gap-3">
            <Label>Cliente</Label>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <SheetSelector type="client" currentId={clientId} onSelect={setClientId} />
                </div>
                <Button 
                    className="col-span-1" 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault(); 
                      e.stopPropagation(); 
                      handleAddClient(); 
                  }}
                >
                  Agregar
                </Button>
            </div>
        </div>

        {isClientSheetOpen && (
          <SheetFormClient
              isOpen={isClientSheetOpen}
              onClose={handleClientFormClose} 
              zIndex={60}
              
          />
        )}

        <div className="grid gap-3">
          <Label>Dispositivo</Label>
          <SheetSelector type="device" currentId={deviceId} onSelect={handleDeviceSelect} />
        </div>

        <div className="grid gap-3">
          <Label>Valor</Label>
          <Input 
            value={totalAmount} 
            onChange={(e) => setTotalAmount(e.target.value)} 
            type="number" 
            step="0.01" 
            required 
          />
        </div>

        <div className="grid gap-3">
          <Label>Trade-In</Label>
          <Button type="button" onClick={handleAddTradeInPhone}>
            Agregar Trade-In
          </Button>
        </div>
        
        {isPhoneSheetOpen && (
          <SheetFormPhone
            isOpen={isPhoneSheetOpen}
            onClose={handlePhoneFormClose}
            zIndex={60}
            depth={1}
          />
        )}

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

        <div className="flex items-center justify-between gap-3">
          <Label>Debe</Label>
          <Checkbox checked={debt} onCheckedChange={(checked) => setDebt(!!checked)} />
        </div>

        {debt && (
          <div className="grid gap-3">
            <Label>Cuánto debe</Label>
            <Input
              type="number"
              value={debtAmount}
              onChange={(e) => setDebtAmount(e.target.value)}
              placeholder="0.00"
              required={debt}
            />
          </div>
        )}
      </CustomSheet>
    </form>
  )
}