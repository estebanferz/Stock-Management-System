import debtIcon from "@/assets/debt.svg?url";
import { generalStringFormat } from "@/utils/formatters";

type DebtorRow = {
  client_id: number;
  name: string;
  debt: number | null;
};

function money(v: number) {
  return `$${Number(v || 0).toFixed(0)}`;
}

export function DebtorsCard({
  count,
  totalDebt,
  rows,
}: {
  count: number;
  totalDebt: number;
  rows: DebtorRow[];
}) {
  return (
    <div className="relative w-full h-96 rounded-2xl border-black bg-white p-4 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-800">Deudores</h3>
          <p className="text-sm text-gray-600">
            {count} Deudores, {money(totalDebt)} deuda total.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
          <img src={debtIcon} className="h-6 w-6" alt="" />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border">
        <div className="grid grid-cols-2 gap-2 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
          <div>Deudor</div>
          <div className="text-right">Monto adeudado</div>
        </div>

        <div className="h-64 overflow-y-auto">
          {rows?.length ? (
            rows.map((r) => (
              <div
                key={r.client_id}
                className="grid grid-cols-2 gap-2 border-t px-3 py-2 text-sm hover:bg-gray-50/60"
              >
                <div className="truncate">
                  {generalStringFormat(String(r.name ?? ""))}
                </div>
                <div className="text-right font-semibold tabular-nums">
                  {money(Number(r.debt))}
                </div>
              </div>
            ))
          ) : (
            <div className="px-3 py-4 text-sm text-gray-500">
              No hay deudores.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
