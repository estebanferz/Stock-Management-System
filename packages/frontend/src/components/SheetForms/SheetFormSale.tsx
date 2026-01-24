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
import { currencies } from "../Structures/currencies"

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
    currency: "Moneda",
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
        currency: row.currency ?? "",
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

    const onNew = () => {
      setEditingSale(null);

      setForm({
        datetime: "",
        total_amount: "",
        currency: "Moneda",
        payment_method: "Pago",
        debt: false,
        debt_amount: "",
        client_id: "",
        seller_id: "",
        device_id: "",
        trade_in_device: "",
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-sale", onEdit as any);
    window.addEventListener("open-new-sale", onNew as any);
    return () => {
      window.removeEventListener("open-edit-sale", onEdit as any);
      window.removeEventListener("open-new-sale", onNew as any);
    }
  }, []);

  type GiftLine = {
    accessory_id: number;
    qty: number;
  };

  type AccessoryLite = {
    accessory_id: number;
    name: string;
    brand: string;
    stock: number;
    price: string; // numeric string
  };

  const [accessories, setAccessories] = useState<AccessoryLite[]>([]);
  const [giftLines, setGiftLines] = useState<GiftLine[]>([]);


  useEffect(() => {
    (async () => {
      try {
        const res = await clientApp.accessory.all.get({
          query: { is_deleted: "false" },
        });

        const rows = (res.data ?? []) as any[];
        setAccessories(
          rows.map((a) => ({
            accessory_id: a.accessory_id,
            name: a.name,
            brand: a.brand,
            stock: Number(a.stock ?? 0),
            price: String(a.price ?? "0"),
          }))
        );
      } catch (e) {
        console.error("Error cargando accesorios:", e);
      }
    })();
  }, []);

  const getAccessory = (id: number) =>
    accessories.find((a) => a.accessory_id === id);

  const giftTotal = giftLines.reduce((acc, line) => {
    const a = getAccessory(line.accessory_id);
    if (!a) return acc;
    return acc + Number(a.price) * line.qty;
  }, 0);

  function updateGiftQty(id: number, qty: number) {
    setGiftLines((prev) =>
      prev.map((x) =>
        x.accessory_id === id ? { ...x, qty: Math.max(1, qty) } : x
      )
    );
  }

  function removeGiftLine(id: number) {
    setGiftLines((prev) => prev.filter((x) => x.accessory_id !== id));
  }


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

    for (const line of giftLines) {
      const a = getAccessory(line.accessory_id);
      if (!a) {
        alert("Accesorio no encontrado");
        return;
      }
      if (line.qty > a.stock) {
        alert(`Stock insuficiente para ${a.brand} ${a.name}`);
        return;
      }
    }

    const payload = {
      datetime,
      debt_amount: form.debt ? form.debt_amount : null,
      debt: form.debt,
      client_id: Number(form.client_id),
      seller_id: Number(form.seller_id),
      device_id: Number(form.device_id),
      trade_in_device: form.trade_in_device ? Number(form.trade_in_device) : null,

      total_amount: form.total_amount,
      payment_method: form.payment_method,
      currency: form.currency,

      gift_accessories: giftLines.map((l) => ({
        accessory_id: l.accessory_id,
        qty: l.qty,
      })),
    };

    try {
      const isEditing = !!editingSale;

      console.log("payload sale:", payload);
      console.log("types:", {
        client_id: typeof payload.client_id,
        seller_id: typeof payload.seller_id,
        device_id: typeof payload.device_id,
      });

      const res = isEditing
        ? await clientApp.sale({ id: editingSale!.sale_id }).put(payload)
        : await clientApp.sale.post(payload);

      const { error } = res;
      if (error) throw error.value;

      window.location.reload();
    } catch (err) {
      console.error("Error al cargar venta:", err);
      alert("Error al cargar venta");
    }
  };

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

  const baseZ = zIndex ?? 100;

return (
    <form id="form-sale" onSubmit={handleSubmitSale}>
      <CustomSheet
        className="md:w-[400px] duration-300 flex flex-col"
        title="Agregar Venta"
        zIndex={zIndex}
        isOpen={internalOpen}
        onOpenChange={setInternalOpen}
        description="Agregar venta de dispositivo al sistema"
        isModal={true}
        showTrigger={false}
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
          <SheetSelector
            parentZIndex={baseZ} 
            type="seller" 
            currentId={form.seller_id} 
            onSelect={(id) => setForm({ ...form, seller_id: id })} />
        </div>

        <div className="grid gap-3">
            <Label>Cliente</Label>
            <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <SheetSelector 
                    type="client" 
                    parentZIndex={baseZ} 
                    currentId={form.client_id} 
                    onSelect={(id) => setForm({ ...form, client_id: id })} />
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
            zIndex={baseZ + 2}
            />

        <div className="grid gap-3">
          <Label>Dispositivo</Label>
          <SheetSelector 
            parentZIndex={baseZ} 
            type="device" 
            currentId={form.device_id} 
            onSelect={handleDeviceSelect} />
        </div>

        <div className="grid gap-3">
          <Label>Valor</Label>
          <Input
            id="price"
            form="form-sale"
            value={form.total_amount} 
            onChange={(e) => setForm({...form, total_amount: e.target.value})} 
            type="number"
            placeholder="0.00" 
            step="1.00" 
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
            zIndex={baseZ + 2}
            depth={1}
          />
        )}

        <div className="grid gap-3">
          <Label>Accesorios de regalo</Label>

          <select
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2"
            value=""
            onChange={(e) => {
              const id = Number(e.target.value);
              if (!id) return;

              setGiftLines((prev) => {
                const exists = prev.find((x) => x.accessory_id === id);

                if (exists) {
                  // si ya estaba, suma 1
                  return prev.map((x) =>
                    x.accessory_id === id ? { ...x, qty: x.qty + 1 } : x
                  );
                }

                // si no estaba, lo agrega con qty = 1
                return [...prev, { accessory_id: id, qty: 1 }];
              });

              // reset del select para permitir elegir otro
              e.target.value = "";
            }}
          >
            <option value="">Seleccionar accesorio</option>
            {accessories.map((a) => (
              <option key={a.accessory_id} value={String(a.accessory_id)}>
                {a.brand} {a.name} — stock {a.stock}
              </option>
            ))}
          </select>

          {giftLines.length > 0 && (
            <div className="mt-2 rounded-xl border bg-white p-3">
              <div className="flex flex-col gap-3">
                {giftLines.map((line) => {
                  const a = getAccessory(line.accessory_id);
                  if (!a) return null;

                  const max = a.stock;
                  const lineTotal = Number(a.price) * line.qty;
                  const outOfStock = line.qty > max;

                  return (
                    <div
                      key={line.accessory_id}
                      className="grid grid-cols-12 items-center gap-2"
                    >
                      <div className="col-span-6 text-sm">
                        <div className="font-medium text-gray-800">
                          {a.brand} {a.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          ${a.price} c/u · stock {a.stock}
                        </div>
                        {outOfStock && (
                          <div className="text-xs text-red-600">
                            Cantidad supera stock
                          </div>
                        )}
                      </div>

                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          value={line.qty}
                          onChange={(e) =>
                            updateGiftQty(line.accessory_id, Number(e.target.value))
                          }
                        />
                      </div>

                      <div className="col-span-2 text-right text-sm text-gray-700">
                        ${lineTotal.toFixed(2)}
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800"
                          onClick={() => removeGiftLine(line.accessory_id)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-2 flex items-center justify-between border-t pt-2 text-sm">
                  <span className="text-gray-600">Total regalo</span>
                  <span className="font-semibold">${giftTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
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
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, payment_method: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Tipo de moneda</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.currency} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currencies.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, currency: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label>Debe</Label>
          <Checkbox 
            checked={form.debt} 
            onCheckedChange={(checked) => setForm({...form, debt: !!checked})}/>
        </div>

        {form.debt && (
          <div className="grid gap-3">
            <Label>Cuánto debe</Label>
            <Input
              id="total_debt"
              form="form-sale"
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