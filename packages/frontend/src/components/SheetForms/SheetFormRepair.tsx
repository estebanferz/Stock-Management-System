import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { SheetSelector } from "@/components/SheetForms/SheetSelector"
import { useEffect, useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { repairStates } from "../Structures/repairStates"
import { priorities } from "../Structures/priorities"
import { ChevronDown} from "lucide-react"
import { clientApp } from "@/lib/clientAPI";
import type { Repair } from "@server/db/schema"
import { DeviceSheetSelector, type DeviceRow, type DeviceSearchParams } from "@/components/SheetForms/DeviceSheetSelector";
import { generalStringFormat, normalizeShortString } from "@/utils/formatters"
import { currencies } from "../Structures/currencies"

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

async function searchDevices(params: DeviceSearchParams): Promise<DeviceRow[]> {
  const res = await clientApp.phone.all.get({
    query: {
      device: params.device?.trim() ? normalizeShortString(params.device.trim()) : undefined,
      imei: params.imei?.trim() ? normalizeShortString(params.imei.trim()) : undefined,
      color: params.color === "any" ? undefined : normalizeShortString(params.color),
      storage_capacity:
        params.storage_capacity === "any" ? undefined : params.storage_capacity,
      battery_health:
        params.battery_min === "any" ? undefined : params.battery_min,
      is_deleted: false,
    },
  });

  if (res.error) throw res.error.value;

  return (res.data ?? []).map((d: any) => ({
    id: String(d.device_id),
    title: `${generalStringFormat(d.brand) ?? ""} ${generalStringFormat(d.name) ?? ""}`.trim(),
    imei: d.imei ?? null,
    color: d.color ?? null,
    storage: d.storage_capacity ?? null,
    battery_health: d.battery_health ?? null,
    subtitle: d.sold ? "Vendido" : null,
  }));
}


export function SheetFormRepair() {

  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0])
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16))
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [form, setForm] = useState({
    datetime: "",
    repair_state: "Estado",
    priority: "Prioridad",
    description: "",
    diagnostic: "",
    client_cost: "",
    currency_sale: "USD",
    internal_cost: "",
    currency_buy: "USD",
    client_id: "",
    technician_id: "",
    device_id: "",
  });
  
  useEffect(() => {
    const onEdit = (e: CustomEvent<Repair>) => {
      const row = e.detail;
  
      setEditingRepair(row);

      // Convert Date → String ISO
      const iso = row.datetime instanceof Date
        ? row.datetime.toISOString()
        : String(row.datetime);

      const [d, t] = iso.split("T");

      setDate(d);                   // YYYY-MM-DD
      setTime(t.slice(0, 5));       // HH:MM
  
      setForm({
        datetime: row.datetime ? String(row.datetime) : "",
        repair_state: row.repair_state ?? "",
        priority: row.priority ?? "",
        description: row.description ?? "",
        diagnostic: row.diagnostic ?? "",
        client_cost: row.client_cost ?? "",
        currency_sale: row.currency_sale ?? "",
        internal_cost: row.internal_cost ?? "",
        currency_buy: row.currency_buy ?? "",
        client_id: row.client_id ? row.client_id.toString() : "",
        technician_id: row.technician_id ? row.technician_id.toString() : "",
        device_id: row.device_id ? row.device_id.toString() : "",
      });
  
      setInternalOpen(true);
    };

    const onNew = () => {
      setEditingRepair(null);

      setForm({
        datetime: "",
        repair_state: "Estado",
        priority: "Prioridad",
        description: "",
        diagnostic: "",
        client_cost: "",
        currency_sale: "USD",
        internal_cost: "",
        currency_buy: "USD",
        client_id: "",
        technician_id: "",
        device_id: "",
      });

      setInternalOpen(true);
    };
  
    window.addEventListener("open-edit-repair", onEdit as any);
    window.addEventListener("open-new-repair", onNew as any);
    return () => {
      window.removeEventListener("open-edit-repair", onEdit as any);
      window.removeEventListener("open-new-repair", onNew as any);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isSubmitting) return;

    const datetime = `${date}T${time}:00Z`;

    if (!form.client_id || !form.technician_id || !form.device_id) {
      alert("Por favor, selecciona Cliente, Tecnico y Dispositivo.");
      return;
    }

    const repairData = {
      ...form,
      datetime: datetime,
      client_id: Number(form.client_id),
      technician_id: Number(form.technician_id),
      device_id: Number(form.device_id),
    }

    try {
      setIsSubmitting(true);
      let response;

      const isEditing = !!editingRepair;

      if (isEditing) {
        response = await clientApp.repair({ id: editingRepair.repair_id }).put(repairData);
      } else {
        response = await clientApp.repair.post(repairData);
      }

      const { data, error } = response;

      if (error) throw error.value;

      window.location.reload();
    } catch (err) {
      console.error("❌ Error al cargar reparación:", err);
      alert("Error al cargar reparación");
    } finally {
      setIsSubmitting(false);
    }
  }

  const baseZ = 100

return (
    <form id="form-repair" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Reparación"
        zIndex={60}
        isOpen={internalOpen}
        onOpenChange={setInternalOpen}
        description="Agregar reparación de dispositivo al sistema"
        isModal={true}
        showTrigger={false}
        footer={
          <>
            <Button type="submit" form="form-repair" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : editingRepair
                  ? "Guardar"
                  : "Agregar"}
            </Button>

            <Button
              variant="outline"
              type="button"
              onClick={() => setInternalOpen(false)}
              disabled={isSubmitting}
            >
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
          <Label>Dispositivo</Label>
          <DeviceSheetSelector
            parentZIndex={baseZ}
            currentId={form.device_id}
            searchDevices={searchDevices}
            onSelect={(id) => setForm({ ...form, device_id: id })}
          />
        </div>

        <div className="grid gap-3">
          <Label>Cliente</Label>
          <SheetSelector   
            parentZIndex={baseZ} 
            type="client" 
            currentId={form.client_id} 
            onSelect={(id) => setForm({...form, client_id: id})} />
        </div>

        <div className="grid gap-3">
          <Label>Tecnico</Label>
          <SheetSelector   
            parentZIndex={baseZ} 
            type="technician" 
            currentId={form.technician_id} 
            onSelect={(id) => setForm({...form, technician_id: id})} />
        </div>

        <div className="grid gap-3">
          <Label>Estado de reparación</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.repair_state} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {repairStates.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, repair_state: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Prioridad</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto w-full justify-between font-normal">
                {form.priority} <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {priorities.map((method) => (
                <DropdownMenuItem key={method.value} onClick={() => setForm({...form, priority: method.value})}>
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Descripción</Label>
          <Input 
            id="description"
            form="form-repair"
            value={form.description} 
            onChange={(e) => setForm({...form, description: e.target.value})} 
            required />
        </div>

        <div className="grid gap-3">
          <Label>Diagnóstico técnico</Label>
          <Input 
            value={form.diagnostic} 
            onChange={(e) => setForm({...form, diagnostic: e.target.value})} 
            />
        </div>

        <div className="grid gap-3">
        <Label>Costo al cliente</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                id="client_cost"
                form="form-repair" 
                type="number" 
                value={form.client_cost} 
                onChange={(e) => setForm({...form, client_cost: e.target.value})} 
                required />
            </div>

            <div className="col-span-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto w-full justify-between font-normal bg-black text-white">
                    {form.currency_sale} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {currencies.map((method) => (
                    <DropdownMenuItem key={method.value} onClick={() => setForm({...form, currency_sale: method.value})}>
                      {method.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div className="grid gap-3">
            <Label>Costo interno</Label>
            <Input
              id="internal_cost"
              form="form-repair" 
              type="number" 
              placeholder="0.00" 
              value={form.internal_cost} 
              onChange={(e) => setForm({...form, internal_cost: e.target.value})} />
        </div>
      </CustomSheet>
    </form>
  )
}