import { useEffect, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Crown } from "lucide-react";
import type { TenantRole } from "@server/db/types";
import { generalStringFormat } from "@/utils/formatters";

type Row = {
  seller_id: number;
  name: string;
  sales_count: number;
  total_sold_formatted: string;
  commission_total_formatted: string;
  avg_ticket_formatted: string;
};

export function SellerLeaderboard({ role }: { role: TenantRole }) {
  if (role !== "owner") return null;

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientApp.seller.metrics.leaderboard.get({
          query: { limit: "5" },
        });

        if (res.data && Array.isArray(res.data)) setRows(res.data as Row[]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="my-6 rounded-2xl border bg-white p-4 shadow-md">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-gray-700" />
          <h3 className="text-base font-semibold text-gray-900">Mejores vendedores</h3>
        </div>
        <span className="text-sm text-gray-500 sm:ml-1">(últimos 6 meses)</span>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl border bg-gray-50" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">Todavía no hay ventas para este período.</p>
      ) : (
        <div className="grid gap-3">
          {rows.map((r, idx) => (
            <div
              key={r.seller_id}
              className="
                rounded-xl border p-3
                flex flex-col gap-3
                md:flex-row md:items-center md:justify-between md:gap-4
              "
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 font-semibold">
                  #{idx + 1}
                </div>

                <div className="font-semibold text-gray-900">
                  {generalStringFormat(r.name)}
                </div>
              </div>

              <div
                className="
                  w-full
                  grid grid-cols-2 gap-x-6 gap-y-3
                  text-left
                  md:w-auto md:text-right md:grid-cols-2
                  lg:grid-cols-4
                "
              >
                <MetricCol label="Ventas" value={r.sales_count} />
                <MetricCol label="Vendido" value={r.total_sold_formatted} />
                <MetricCol label="Comisión" value={r.commission_total_formatted} />
                <MetricCol label="Ticket prom." value={r.avg_ticket_formatted} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCol({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col md:items-end">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}