import { CustomSheet } from "@/components/CustomSheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { SheetSelector } from "@/components/SheetForms/SheetSelector";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { paymentMethods } from "../Structures/paymentMethods";
import { ChevronDown } from "lucide-react";
import { clientApp } from "@/lib/clientAPI";
import type { Expense } from "@server/db/schema";
import { SheetClose } from "../ui/sheet";
import { currencies } from "../Structures/currencies";

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

interface SheetFormExpenseProps {
  isOpen?: boolean; // optional, nested mode
  onClose?: () => void; // optional, nested mode
  zIndex?: number; // optional, nested mode
  injectedAmount?: string;
  injectedDescription?: string;
  depth?: number;
}

async function uploadAndLinkReceipt(expenseId: number, file: File) {
  const presign = await clientApp.expense({ id: expenseId }).receipt.presign.post({
    contentType: file.type,
    filename: file.name,
    size: file.size,
  });

  if (presign.error) throw presign.error.value;

  const presignData: any = presign.data;
  if (!presignData?.ok) throw new Error(presignData?.message ?? "Presign failed");

  const { putUrl, key } = presignData;

  const putRes = await fetch(putUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) throw new Error(`Upload to bucket failed (${putRes.status})`);

  const link = await clientApp.expense({ id: expenseId }).receipt.link.post({
    key,
    contentType: file.type,
    filename: file.name,
    size: file.size,
  });

  if (link.error) throw link.error.value;

  const linkData: any = link.data;
  if (!linkData?.ok) throw new Error(linkData?.message ?? "Link failed");
}


export function SheetFormExpense({
  isOpen,
  onClose,
  zIndex,
  injectedAmount,
  injectedDescription,
  depth = 0,
}: SheetFormExpenseProps) {
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16));
  const [receiptFile, setReceiptFile] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false); // Only used when not nested
  const isNested = onClose !== undefined;
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen;

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState({
    category: isNested ? "Producto" : "",
    description: "",
    amount: `${injectedAmount || ""}`,
    currency: "USD",
    payment_method: "Pago",
    provider_id: "",
  });

  useEffect(() => {
    const onEdit = (e: CustomEvent<Expense>) => {
      const row = e.detail;

      setEditingExpense(row);

      const iso =
        row.datetime instanceof Date ? row.datetime.toISOString() : String(row.datetime);

      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));

      setForm({
        category: row.category ?? "",
        description: row.description ?? "",
        amount: row.amount ?? "",
        currency: row.currency ?? "USD",
        payment_method: row.payment_method ?? "",
        provider_id: String(row.provider_id) ?? "",
      });

      setInternalOpen(true);
    };

    const onNew = () => {
      setEditingExpense(null);

      const local = getLocalTime();
      const iso = local.toISOString();
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));

      setForm({
        category: isNested ? "Producto" : "",
        description: "",
        amount: `${injectedAmount || ""}`,
        currency: "USD",
        payment_method: "Pago",
        provider_id: "",
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-expense", onEdit as any);
    window.addEventListener("open-new-expense", onNew as any);
    return () => {
      window.removeEventListener("open-edit-expense", onEdit as any);
      window.removeEventListener("open-new-expense", onNew as any);
    }
  }, []);

  useEffect(() => {
    if (injectedAmount !== undefined) {
      setForm((prev) => ({ ...prev, amount: injectedAmount }));
    }
  }, [injectedAmount]);

  useEffect(() => {
    if (injectedDescription !== undefined) {
      setForm((prev) => ({ ...prev, description: injectedDescription }));
    }
  }, [injectedDescription]);

  const handleOpenChange = (open: boolean) => {
    if (isSubmitting) return;
    if (onClose) {
      if (!open) onClose();
      return;
    } else {
      setInternalOpen(open);
    }

    if (!open && !isNested) {
      setEditingExpense(null);
      setReceiptFile(undefined);
      setForm({
        category: isNested ? "Producto" : "",
        description: "",
        amount: "",
        currency: "USD",
        payment_method: "Pago",
        provider_id: "",
      });
      const newLocalTime = getLocalTime();
      setDate(newLocalTime.toISOString().split("T")[0]);
      setTime(newLocalTime.toISOString().slice(11, 16));
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    const datetime = `${date}T${time}:00Z`;
    const expenseData = {
      ...form,
      datetime,
      provider_id: form.provider_id ? Number(form.provider_id) : null,
    };

    try {
      setIsSubmitting(true);

      let expenseId: number;

      if (editingExpense) {
        const r = await clientApp.expense({ id: editingExpense.expense_id }).put(expenseData as any);
        if (r.error) throw r.error.value;

        // tu PUT devuelve result[0]
        expenseId = (r.data as any)?.expense_id ?? editingExpense.expense_id;
      } else {
        const r = await clientApp.expense.post(expenseData as any);
        if (r.error) throw r.error.value;

        // tu POST devuelve returning() => array
        expenseId = (r.data as any)?.[0]?.expense_id;
        if (!expenseId) throw new Error("No pude obtener expense_id del backend.");
      }

      if (receiptFile) {
        await uploadAndLinkReceipt(expenseId, receiptFile);
      }

      if (isNested) {
        onClose!();
      } else {
        window.location.href = "/expense";
      }
    } catch (err) {
      console.error("❌ Error al cargar gasto:", err);
      alert("Error al cargar gasto");
      if (isNested) onClose!();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePropagationStop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <form id="form-expense" onSubmit={handleSubmitExpense}>
      <CustomSheet
        title="Agregar Gasto"
        description="Agregar gasto de dispositivo al sistema"
        onInteractOutside={(e) => e.preventDefault()}
        side="right"
        isOpen={controlledOpen}
        onOpenChange={handleOpenChange}
        isNested={isNested}
        depth={depth}
        zIndex={zIndex}
        showTrigger={false}
        footer={
          <>
            <Button type="submit" form="form-expense" disabled={isSubmitting}>
              {isSubmitting
                ? "Guardando..."
                : editingExpense
                  ? "Guardar"
                  : "Agregar"}
            </Button>

            <SheetClose asChild>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
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
          <Label>Categoría</Label>
          <Input
            id="category"
            form="form-expense"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            required
          />
        </div>

        <div className="grid gap-3">
          <Label>Descripción</Label>
          <Input
            id="description"
            form="form-expense"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid gap-3">
        <Label>Monto</Label>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <Input
                id="amount"
                form="form-expense" 
                type="number" 
                value={form.amount} 
                onChange={(e) => setForm({...form, amount: e.target.value})} 
                required />
            </div>

            <div className="col-span-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto w-full justify-between font-normal bg-black text-white">
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
          </div>
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
                <DropdownMenuItem
                  key={method.value}
                  onClick={() => setForm({ ...form, payment_method: method.value })}
                >
                  {method.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-3">
          <Label>Comprobante</Label>
          <Input
            id="receipt"
            form="form-expense"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              setReceiptFile(file);
            }}
          />
        </div>

        <div className="grid gap-3">
          <Label>Proveedor</Label>
          <SheetSelector
            depth={isNested ? depth : 1}
            type="provider"
            currentId={form.provider_id}
            onSelect={(id) => setForm({ ...form, provider_id: id ?? "" })}
          />
        </div>
      </CustomSheet>
    </form>
  );
}
