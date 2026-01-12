import { useMemo, useState } from "react";
import CustomCard from "@/components/CustomCard";
import { CenteredModal } from "@/components/Dashboard/CenteredModal";
import { generalStringFormat } from "@/utils/formatters";

// elegí el icono que quieras (podés reutilizar devicesIcon si te gusta)
import devicesIcon from "@/assets/devices.svg";

type Row = {
  device_id: number;
  device_name: string;
  buy_cost: number;
};

function money(v: number) {
  return `$${Number(v || 0).toFixed(0)}`;
}

export function InvestmentCard({
  totalInvestment,
  rows,
}: {
  totalInvestment: string | number;
  rows: Row[];
}) {
  const [open, setOpen] = useState(false);

  const stockCount = useMemo(() => (rows ?? []).length, [rows]);

  const totalCheck = useMemo(() => {
    return (rows ?? []).reduce((acc, r) => acc + Number(r.buy_cost || 0), 0);
  }, [rows]);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer transition hover:scale-[1.02] hover:shadow-xl"
      >
        <CustomCard
          title="Inversión en Stock"
          amount={`$${totalInvestment}`}
          icon={devicesIcon}
        />
      </div>

      <CenteredModal
        open={open}
        onClose={() => setOpen(false)}
        title="Inversión"
        maxWidth="max-w-3xl"
      >
        <div className="text-sm text-muted-foreground mb-4">
          (total de stock: <span className="font-semibold">{stockCount}</span>)
        </div>

        <div className="border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-xs font-semibold text-gray-600 dark:text-gray-200">
            <div>Dispositivo</div>
            <div className="text-right">Valor de compra</div>
          </div>

          {/* Body */}
          <div className="max-h-[55vh] overflow-y-auto">
            {rows?.length ? (
              rows.map((r) => (
                <div
                  key={r.device_id}
                  className="grid grid-cols-2 gap-2 px-4 py-3 border-t text-sm hover:bg-gray-50/60 dark:hover:bg-neutral-800/60"
                >
                  <div className="truncate">
                    {generalStringFormat(String(r.device_name ?? ""))}
                  </div>
                  <div className="text-right tabular-nums font-semibold">
                    {money(r.buy_cost)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No hay dispositivos en stock.
              </div>
            )}
          </div>

          {/* Footer total */}
          {/* <div className="grid grid-cols-2 gap-2 px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-t text-sm">
            <div className="text-right font-semibold">Total</div>
            <div className="text-right font-bold tabular-nums">
              {money(totalCheck)}
            </div>
          </div> */}
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-5 px-4 py-2 rounded-lg bg-gray-200 hover:bg-mainColor hover:text-white w-full transition"
        >
          Cerrar
        </button>
      </CenteredModal>
    </>
  );
}
