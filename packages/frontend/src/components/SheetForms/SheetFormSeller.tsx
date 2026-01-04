import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { clientApp } from "@/lib/clientAPI"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import type { Seller } from "@server/db/schema"
import { toInputDate } from "@/utils/formatters"

interface SheetFormSellerProps {
  zIndex?: number;
}

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

function normalizePhoneE164(raw: string): string | null {
  if (!raw) return null;

  const phone = parsePhoneNumberFromString(raw, "AR"); // default AR
  if (!phone || !phone.isValid()) return null;

  return phone.format("E.164"); // +54911...
}

export function SheetFormSeller({zIndex}: SheetFormSellerProps) {

  const initialLocalTime = getLocalTime();
  const [hireDate, setHireDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [payDate, setPayDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  
  const [internalOpen, setInternalOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [form, setForm] = useState({
    name: "",
    age: "",
    email: "",
    phone_number: "",
    hire_date: "",
    pay_date: "",
    commission: "",
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Seller>) => {
      const row = e.detail;
  
      setEditingSeller(row);

      setHireDate(toInputDate(row.hire_date));
      setPayDate(toInputDate(row.pay_date));

      setForm({
        name: row.name ?? "",
        age: row.age ? String(row.age) : "",
        email: row.email ? String(row.email) : "",
        phone_number: row.phone_number ?? "",
        hire_date: row.hire_date ?? "",
        pay_date: row.pay_date ?? "",
        commission: row.commission ? String(row.commission) : "",
      });
  
      setInternalOpen(true);
    };
  
    window.addEventListener("open-edit-seller", onEdit as any);
    return () => window.removeEventListener("open-edit-seller", onEdit as any);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    console.log(hireDate.toString().split("T")[0])
    const sellerData = {
        name: form.name,
        age: parseInt(form.age),
        email: form.email,
        phone_number: form.phone_number,
        hire_date: hireDate.toString().split("T")[0],
        pay_date: payDate.toString().split("T")[0],
        commission: form.commission,
    }

    try {
      let response;

      if (editingSeller) {
        response = await clientApp.seller({ id: editingSeller.seller_id }).put(sellerData);
      } else {
        response = await clientApp.seller.post(sellerData);
      }

      const { data, error } = response;

      if (error) throw error.value;

      window.location.reload();
    } catch (err) {
      console.error("Error al cargar vendedor:", err);
      alert("Error al cargar vendedor");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Vendedor"
        zIndex={zIndex}
        isOpen={internalOpen}
        onOpenChange={setInternalOpen}
        description="Agregar vendedor al sistema"
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
          <Label>Nombre</Label>
          <Input 
            id="name"
            form="form-seller"
            value={form.name} 
            onChange={(e) => setForm({...form, name: e.target.value})} 
            required />
        </div>
        
        <div className="grid gap-3">
          <Label>Edad</Label>
          <Input
            id="name"
            form="form-seller"
            type="number"
            value={form.age}
            onChange={(e) => setForm({...form, age: e.target.value})}
          />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input 
            id="email"
            form="form-seller"
            type="email" 
            value={form.email} 
            onChange={(e) => setForm({...form, email: e.target.value})} 
            placeholder="example@gmail.com"
            required />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input
            id="phone"
            form="form-seller"
            value={form.phone_number}
            onChange={(e) => {
              setForm({...form, phone_number: e.target.value.replace(/[^\d+]/g, "")})
            }}
            onBlur={() => {
              const normalized = normalizePhoneE164(form.phone_number);
              if (normalized) setForm({...form, phone_number: normalized});
            }}
            inputMode="tel"
            placeholder="+54 9 223 1234567"
            required
          />
        </div>

        <div className="grid gap-3">
          <Label>Comisión</Label>
          <Input
            id="commission"
            form="form-seller" 
            value={form.commission} 
            onChange={(e) => setForm({...form, commission: e.target.value})} 
            type="number"
            placeholder="0.00" 
            required 
          />
        </div>

        <div className="grid gap-3">
          <Label>Fecha de contratación</Label>
          <Input
            id="hire_date"
            form="form-seller"
            type="date"
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          <Label>Fecha de pago</Label>
          <Input
            id="pay_date"
            form="form-seller"
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />
        </div>
      </CustomSheet>
    </form>
  )
}



