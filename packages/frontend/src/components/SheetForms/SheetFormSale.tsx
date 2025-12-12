import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
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
import type { Sale } from "@server/db/schema"

interface SheetFormSaleProps {
  zIndex?: number;
}

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

export function SheetFormSale({zIndex}:SheetFormSaleProps) {
  
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))
  
  // Control opening of SheetFormClient
  const [isClientSheetOpen, setIsClientSheetOpen] = useState(false);
  // Control opening of SheetFormPhone
  const [isPhoneSheetOpen, setIsPhoneSheetOpen] = useState(false);

  const [internalOpen, setInternalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [form, setForm] = useState({
    datetime: "",
    total_amount: "",
    payment_method: "Pago",
    debt: false,
    debt_amount: "",
    client_id: "",
    seller_id: "",
    device_id: "",
    trade_in_device: "",
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Sale>) => {
      const row = e.detail;

      setEditingSale(row);
      
      // Convert Date → String ISO
      const iso = row.datetime instanceof Date
        ? row.datetime.toISOString()
        : String(row.datetime);

      const [d, t] = iso.split("T");

      setDate(d);                   // YYYY-MM-DD
      setTime(t.slice(0, 5));       // HH:MM

      setForm({
        datetime: row.datetime ? String(row.datetime) : "",
        total_amount: row.total_amount ? String(row.total_amount) : "",
        payment_method: row.payment_method ?? "",
        debt: row.debt ?? false,
        debt_amount: row.debt_amount ? String(row.debt_amount) : "",
        client_id: row.client_id ? String(row.client_id) : "",
        seller_id: row.seller_id ? String(row.seller_id) : "",
        device_id: row.device_id ? String(row.device_id) : "",
        trade_in_device: row.trade_in_device ? String(row.trade_in_device) : "",
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-sale", onEdit as any);
    return () => window.removeEventListener("open-edit-sale", onEdit as any);
  }, []);

  const handleDeviceSelect = (id: string, price?: string) => {
    setForm({ ...form, device_id: id });
    if (price) {
      setForm(prev => ({ ...prev, total_amount: price }));
    }
  };
  const handleAddTradeInPhone = () => {
    setIsPhoneSheetOpen(true);
  };
  const handlePhoneFormClose = (newPhoneId?: string) => {
    setIsPhoneSheetOpen(false);
    
    if (newPhoneId) {
      setForm({...form, trade_in_device: newPhoneId});
    }
  };


  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const datetime = `${date}T${time}:00Z`;
    
    if (!form.client_id || !form.seller_id || !form.device_id) {
        alert("Por favor, selecciona Cliente, Vendedor y Dispositivo.");
        return;
    }

    const saleData = {
      ...form,
      datetime: datetime,
      debt_amount: form.debt ? form.debt_amount : null,
      client_id: Number(form.client_id),
      payment_method: form.payment_method,
      device_id: Number(form.device_id),
      total_amount: form.total_amount,
      seller_id: Number(form.seller_id),
      trade_in_device: form.trade_in_device ? Number(form.trade_in_device) : null,
    }

    try {
      let response;

      const isEditing = !!editingSale;

      if (isEditing) {
        response = await clientApp.sale({ id: editingSale.sale_id }).put(saleData);
      } else {
        response = await clientApp.sale.post(saleData);
      }

      const { data, error } = response;

      if (error) throw error.value;

      if (!isEditing) {
        const deviceIdNumber = Number(form.device_id);

        const { data: currentPhoneData, error: getError } =
          await (clientApp.phone as any)({ id: deviceIdNumber }).get();

        console.log(currentPhoneData);
        if (getError || !currentPhoneData) {
          window.location.reload();
          return;
        }

        const updatePayload = {
          ...currentPhoneData,
          sold: true,
        };
        delete updatePayload.datetime;

        console.log(`🛠️ Enviando actualización de estado (sold: true)...`);

        const { error: phoneUpdateError } =
          await (clientApp.phone as any)({ id: deviceIdNumber }).put(updatePayload);

        if (phoneUpdateError) {
          console.error(
            "Falló la actualización final del dispositivo:",
            phoneUpdateError.value
          );
        } else {
          console.log("Device marked as sold.");
        }
      }

      window.location.reload();

    } catch (err) {
      console.error("Error al cargar venta:", err);
      alert("Error al cargar venta");
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
          setForm({...form, client_id: newClientId}); 
      }
  };


return (
    <form id="form-sale" onSubmit={handleSubmitSale}>
      <CustomSheet
        className="w-[400px] duration-300 flex flex-col"
        title="Agregar Venta"
        zIndex={zIndex}
        isOpen={internalOpen}
        onOpenChange={setInternalOpen}
        description="Agregar venta de dispositivo al sistema"
        isModal={true}
        footer={
          <>
            <Button type="submit" form="form-sale">Agregar</Button>
            <Button variant="outline" onClick={() => setInternalOpen(false)}>
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
          <Label>Vendedor</Label>
          <SheetSelector type="seller" currentId={form.seller_id} onSelect={(id) => setForm({ ...form, seller_id: id })} />
        </div>

        <div className="grid gap-3">
            <Label>Cliente</Label>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <SheetSelector type="client" currentId={form.client_id} onSelect={(id) => setForm({ ...form, client_id: id })} />
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
        <SheetFormClient
            isOpen={isClientSheetOpen}
            onClose={handleClientFormClose} 
            zIndex={60}
            />

        <div className="grid gap-3">
          <Label>Dispositivo</Label>
          <SheetSelector type="device" currentId={form.device_id} onSelect={handleDeviceSelect} />
        </div>

        <div className="grid gap-3">
          <Label>Valor</Label>
          <Input 
            value={form.total_amount} 
            onChange={(e) => setForm({...form, total_amount: e.target.value})} 
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
                {form.payment_method} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {paymentMethods.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, payment_method: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Debe</Label>
          <Checkbox checked={form.debt} onCheckedChange={(checked) => setForm({...form, debt: !!checked})} />
        </div>

        {form.debt && (
          <div className="grid gap-3">
            <Label>Cuánto debe</Label>
            <Input
              type="number"
              value={form.debt_amount}
              onChange={(e) => setForm({...form, debt_amount: e.target.value})}
              placeholder="0.00"
              required={form.debt}
            />
          </div>
        )}
      </CustomSheet>
    </form>
  )
}