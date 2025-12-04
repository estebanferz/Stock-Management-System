import { CustomSheet } from "@/components/CustomSheet"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SheetClose } from "@/components/ui/sheet"
import { useState } from "react"
import { clientApp } from "@/lib/clientAPI"
import { parsePhoneNumberFromString } from "libphonenumber-js"

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

export function SheetFormSeller() {
  const [sellerName, setSellerName] = useState("")
  const [sellerAge, setSellerAge] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [sellerPhone, setSellerPhone] = useState("")
  const today = new Date();
  const localDateString = today.toLocaleDateString("en-CA"); // YYYY-MM-DD local, sin UTC

  const [hireDate, setHireDate] = useState(localDateString);
  const [payDate, setPayDate] = useState(localDateString);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const sellerData = {
        name: sellerName,
        age: parseInt(sellerAge),
        email: sellerEmail,
        phone_number: sellerPhone,
        hire_date: hireDate,
        pay_date: payDate,
    }

    try {
      console.log("Enviando sellerData:", sellerData);
      const { data, error } = await clientApp.seller.post(sellerData);
      console.log("Respuesta del servidor:", { data, error });

      if (error) throw error.value;

      alert("Seller successfully created");
      window.location.href = "/seller";
    } catch (err) {
      console.error("Error al cargar vendedor:", err);
      alert("Error al cargar vendedor");
    }
  }


return (
    <form id="form-sale" onSubmit={handleSubmit}>
      <CustomSheet
        title="Agregar Vendedor"
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
          <Input value={sellerName} onChange={(e) => setSellerName(e.target.value)} required />
        </div>
        
        <div className="grid gap-3">
          <Label>Edad</Label>
          <Input
            type="number"
            value={sellerAge}
            onChange={(e) => setSellerAge(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          <Label>Email</Label>
          <Input type="email" value={sellerEmail} onChange={(e) => setSellerEmail(e.target.value)} required />
        </div>

        <div className="grid gap-3">
          <Label>Telefono</Label>
          <Input
            value={sellerPhone}
            onChange={(e) => {
              setSellerPhone(e.target.value.replace(/[^\d+]/g, ""));
            }}
            onBlur={() => {
              const normalized = normalizePhoneE164(sellerPhone);
              if (normalized) setSellerPhone(normalized);
            }}
            inputMode="tel"
            placeholder="+54 9 223 1234567"
            required
          />
        </div>

        <div className="grid gap-3">
          <Label>Fecha de contratación</Label>
          <Input
            type="date"
            value={hireDate}
            onChange={(e) => setHireDate(e.target.value)}
          />
        </div>

        <div className="grid gap-3">
          <Label>Fecha de pago</Label>
          <Input
            type="date"
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />
        </div>
      </CustomSheet>
    </form>
  )
}



