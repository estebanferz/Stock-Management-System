import React, { useState } from 'react';
import { clientApp } from "@/lib/clientAPI";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetFooter
} from "@/components/ui/sheet"; // Ajusta según tu librería de UI

export const NewDepositSheet = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Escuchar el evento personalizado para abrir el form
  React.useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-new-deposit", handleOpen);
    return () => window.removeEventListener("open-new-deposit", handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name") as string,
      address: formData.get("address") as string,
    };

    try {
      // El tenant_id se gestiona en el backend (depositController) 
      // gracias al protectedController que configuramos antes.
      const { error } = await clientApp.deposit.post(payload);

      if (!error) {
        setOpen(false);
        window.location.reload(); // Recargamos para ver el nuevo depósito en el carrusel
      } else {
        alert("Error al guardar el depósito");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Nuevo Depósito</SheetTitle>
          <SheetDescription>
            Registra un nuevo lugar de almacenamiento para Zuma+.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-8">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nombre del Depósito</label>
            <input 
              name="name" 
              required 
              placeholder="Ej: Depósito Central"
              className="w-full text-sm p-2 border rounded-md focus:ring-2 focus:ring-mainColor outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Dirección (Opcional)</label>
            <input 
              name="address" 
              placeholder="Ej: Av. Colón 1234"
              className="w-full text-sm p-2 border rounded-md focus:ring-2 focus:ring-mainColor outline-none"
            />
          </div>

          <SheetFooter className="mt-8">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full text-sm bg-black text-white p-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Depósito"}
            </button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};