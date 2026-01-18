import { useMemo, useState } from "react";
import CustomCard from "@/components/CustomCard";
import { CenteredModal } from "./CenteredModal";
import moneyIcon from "@/assets/money-income.svg";
import { generalStringFormat } from "@/utils/formatters";

type Row = {
  sale_id: number;
  device_name: string;
  buy_cost: number;
  total_amount: number;
  profit: number;
};

function money(v: number) {
  return `$${Number(v || 0).toFixed(0)}`;
}

export function NetIncomeCard({
  netIncome,
  rows,
}: {
  netIncome: string | number;
  rows: Row[];
}) {
  const [open, setOpen] = useState(false);

  const totalProfit = useMemo(() => {
    return (rows ?? []).reduce((acc, r) => acc + Number(r.profit || 0), 0);
  }, [rows]);

  return (
    <>
      {/* Card clickeable */}
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer transition hover:scale-[1.02]"
      >
        <CustomCard title="Ingresos Netos" description="Ingresos netos del negocio" amount={`$${netIncome}`} icon={moneyIcon} />
      </div>

      {/* Modal centrado */}
      <CenteredModal
        open={open}
        onClose={() => setOpen(false)}
        title="Ingresos"
        maxWidth="max-w-3xl"
      >
        <div className="text-sm text-muted-foreground mb-4">
          Ganancia por venta (Valor vendido − Costo de compra)
        </div>

        <div className="border rounded-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-gray-50 dark:bg-neutral-800 text-xs font-semibold text-gray-600 dark:text-gray-200">
            <div>Dispositivo</div>
            <div className="text-right">Compra</div>
            <div className="text-right">Venta</div>
            <div className="text-right">Ganancia</div>
          </div>

          {/* Body */}
          <div className="max-h-[55vh] overflow-y-auto">
            {rows?.length ? (
              rows.map((r) => (
                <div
                  key={r.sale_id}
                  className="grid grid-cols-4 gap-2 px-4 py-3 border-t text-sm hover:bg-gray-50/60 dark:hover:bg-neutral-800/60"
                >
                  <div className="truncate">
                    {generalStringFormat(String(r.device_name ?? ""))}
                  </div>
                  <div className="text-right tabular-nums">{money(r.buy_cost)}</div>
                  <div className="text-right tabular-nums">{money(r.total_amount)}</div>

                  <div className="text-right tabular-nums font-semibold">
                    {money(r.profit)}
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-6 text-sm text-muted-foreground">
                No hay ventas para mostrar.
              </div>
            )}
          </div>

          {/* Footer total */}
          {/* <div className="grid grid-cols-4 gap-2 px-4 py-3 bg-gray-50 dark:bg-neutral-800 border-t text-sm">
            <div className="col-span-3 text-right font-semibold">Total</div>
            <div className="text-right font-bold tabular-nums">
              {money(totalProfit)}
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
