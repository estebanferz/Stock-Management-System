import { useEffect, useState } from "react";
import { CustomSheet } from "@/components/CustomSheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { SheetFormExpense } from "./SheetFormExpense";
import { clientApp } from "@/lib/clientAPI";
import type { Accessory } from "@server/db/schema";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { accessoryCategories } from "../Structures/accessoryCategories";
import { deposits } from "../Structures/deposits";
import { currencies } from "../Structures/currencies";
import { SheetClose } from "../ui/sheet";

interface SheetFormAccessoryProps {
  isOpen?: boolean;
  onClose?: (newAccessoryId?: string) => void;
  zIndex?: number;
  depth?: number;
}

const getLocalTime = () => {
  const today = new Date();
  return new Date(today.getTime() - today.getTimezoneOffset() * 60000);
};

export function SheetFormAccessory({
  isOpen,
  onClose,
  zIndex,
  depth = 0,
}: SheetFormAccessoryProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const controlledOpen = isOpen !== undefined ? isOpen : internalOpen;

  const handleOpenChange = (open: boolean) => {
    if (onClose) {
      if (!open) onClose();
      return;
    }
    setInternalOpen(open);
  };

  const [editingAccessory, setEditingAccessory] = useState<Accessory | null>(
    null
  );

  const [form, setForm] = useState({
    datetime: "",
    name: "",
    brand: "",
    stock: "",
    color: "",
    category: "Categoria",
    price: "",
    currency_sale: "USD",
    buy_cost: "",
    currency_buy: "USD",
    deposit: "Deposito",
    gift: false,
  });

  // Fecha / hora separadas
  const initialLocalTime = getLocalTime();
  const [date, setDate] = useState(initialLocalTime.toISOString().split("T")[0]);
  const [time, setTime] = useState(initialLocalTime.toISOString().slice(11, 16));

  // Expense sheet
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const handleExpenseFormClose = () => setIsExpenseSheetOpen(false);

  function handleOpenExpenseSheet() {
    const cost = parseFloat(form.buy_cost);
    if (!cost || cost <= 0) return;
    setIsExpenseSheetOpen(true);
  }

  useEffect(() => {
    const onEdit = (e: CustomEvent<Accessory>) => {
      const row = e.detail;
      setEditingAccessory(row);

      const iso =
        row.datetime instanceof Date ? row.datetime.toISOString() : String(row.datetime);
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));

      setForm({
        datetime: String(row.datetime) ?? "",
        name: row.name ?? "",
        brand: row.brand ?? "",
        stock: row.stock !== null && row.stock !== undefined ? String(row.stock) : "0",
        color: row.color ?? "",
        category: row.category ?? "",
        price: row.price ?? "",
        currency_sale: row.currency_sale ?? "USD",
        buy_cost: row.buy_cost ?? "",
        currency_buy: row.currency_buy ?? "USD",
        deposit: row.deposit ?? "",
        gift: row.gift ?? false,
      });

      setInternalOpen(true);
    };

    const onNew = () => {
      setEditingAccessory(null);

      const local = getLocalTime();
      const iso = local.toISOString();
      const [d, t] = iso.split("T");
      setDate(d);
      setTime(t.slice(0, 5));

      setForm({
        datetime: "",
        name: "",
        brand: "",
        stock: "",
        color: "",
        category: "Categoria",
        price: "",
        currency_sale: "USD",
        buy_cost: "",
        currency_buy: "USD",
        deposit: "",
        gift: false,
      });

      setInternalOpen(true);
    };

    window.addEventListener("open-edit-accessory", onEdit as any);
    window.addEventListener("open-new-accessory", onNew as any);
    return () => {
      window.removeEventListener("open-edit-accessory", onEdit as any);
      window.removeEventListener("open-new-accessory", onNew as any);
    };
  }, []);

  const isNested = onClose !== undefined;
  const nextDepth = depth + 1;

  const expenseDescription = `Compra de accesorio: ${form.brand} ${form.name}`.trim();

  const handleSubmitAccessory = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;


    const datetime = `${date}T${time}:00Z`;

    // stock: integer
    const stockNum =
      form.stock === "" ? 0 : Number.isNaN(Number(form.stock)) ? 0 : Number(form.stock);

    const accessoryData = {
      ...form,
      datetime,
      stock: stockNum,
      gift: !!form.gift,
    };

    try {
      setIsSubmitting(true);

      let response;

      if (editingAccessory) {
        response = await clientApp.accessory({ id: editingAccessory.accessory_id }).put(
          accessoryData as any
        );
      } else {
        response = await clientApp.accessory.post(accessoryData as any);
      }

      const { data, error } = response;
      if (error) throw error.value;

      const newId = (data as Accessory | null | undefined)?.accessory_id;

      if (onClose) {
        if (newId) onClose(String(newId));
        else onClose();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error("Error al cargar accesorio:", err);
      alert("Error al cargar accesorio");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditMode = !!editingAccessory;

  return (
    <>
      <form id="form-accessory" onSubmit={handleSubmitAccessory}>
        <CustomSheet
          title={isEditMode ? "Editar Accesorio" : "Agregar Accesorio"}
          description={
            isEditMode
              ? "Editar un accesorio del inventario"
              : "Agregar un accesorio al inventario"
          }
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
              <Button type="submit" form="form-accessory" disabled={isSubmitting}>
                {isSubmitting
                  ? "Guardando..."
                  : editingAccessory
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
          {/* Fecha y hora */}
          <div className="grid gap-3">
            <Label>Fecha y hora</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          {/* Marca */}
          <div className="grid gap-3">
            <Label>Marca</Label>
            <Input
              id="brand"
              form="form-accessory"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />
          </div>

          {/* Nombre */}
          <div className="grid gap-3">
            <Label>Nombre</Label>
            <Input
              id="name"
              form="form-accessory"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          {/* Stock */}
          <div className="grid gap-3">
            <Label>Stock</Label>
            <Input
              id="stock"
              form="form-accessory"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value.replace(/[^\d]/g, "") })}
              required
            />
          </div>

          {/* Color */}
          <div className="grid gap-3">
            <Label>Color</Label>
            <Input
              id="color"
              form="form-accessory"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
            />
          </div>

          {/* Categoría (dropdown si tenés array, si no dejá input) */}
          <div className="grid gap-3">
            <Label>Categoría</Label>

            {Array.isArray(accessoryCategories) && accessoryCategories.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="ml-auto w-full justify-between font-normal"
                    type="button"
                  >
                    {form.category} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {accessoryCategories.map((c: any) => (
                    <DropdownMenuItem
                      key={c.value}
                      onClick={() => setForm({ ...form, category: c.value })}
                    >
                      {c.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Input
                id="category"
                form="form-accessory"
                value={form.category === "Categoria" ? "" : form.category}
                placeholder="Categoría"
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              />
            )}
          </div>

          <div className="grid gap-3">
          <Label>Precio de venta</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Input
                  id="price"
                  form="form-accessory" 
                  type="number" 
                  value={form.price} 
                  onChange={(e) => setForm({...form, price: e.target.value})} 
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
          <Label>Costo de compra</Label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                  <Input
                    id="cost"
                    form="form-accessory"
                    type="number" 
                    value={form.buy_cost} 
                    onChange={(e) => setForm({...form, buy_cost: e.target.value})}
                    required 
                  />
              </div>

              <div className="col-span-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="ml-auto w-full justify-between font-normal bg-black text-white">
                      {form.currency_buy} <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {currencies.map((method) => (
                      <DropdownMenuItem key={method.value} onClick={() => setForm({...form, currency_buy: method.value})}>
                        {method.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <Button 
                className="w-full" 
                type="button"
                disabled={!form.buy_cost || Number(form.buy_cost) <= 0}
                onClick={(e) => { handleOpenExpenseSheet(); }}
            >
              Agregar gasto asociado
            </Button>
          </div>

          <div className="grid gap-3">
            <Label>Depósito</Label>

            {Array.isArray(deposits) && deposits.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="ml-auto w-full justify-between font-normal"
                    type="button"
                  >
                    {form.deposit} <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {deposits.map((d: any) => (
                    <DropdownMenuItem
                      key={d.value}
                      onClick={() => setForm({ ...form, deposit: d.value })}
                    >
                      {d.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Input
                id="deposit"
                form="form-accessory"
                value={form.deposit === "Deposito" ? "" : form.deposit}
                placeholder="Depósito"
                onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                required
              />
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label>Es regalo</Label>
            <Checkbox
              id="gift"
              form="form-accessory"
              checked={form.gift}
              onCheckedChange={(checked) => setForm({ ...form, gift: !!checked })}
            />
          </div>
        </CustomSheet>
      </form>

      {isExpenseSheetOpen && (
        <SheetFormExpense
          isOpen={isExpenseSheetOpen}
          onClose={handleExpenseFormClose}
          zIndex={(zIndex ?? 100) + 2}
          injectedAmount={form.buy_cost}
          injectedDescription={expenseDescription}
          depth={nextDepth}
        />
      )}
    </>
  );
}
