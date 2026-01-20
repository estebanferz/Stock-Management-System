import { useEffect, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Crown, DollarSign, Percent, ShoppingCart, TrendingUp } from "lucide-react";
import type { TenantRole } from "@server/db/types";
import { generalStringFormat } from "@/utils/formatters";

type Role = TenantRole;

type Row = {
  seller_id: number;
  name: string;
  sales_count: number;
  total_sold: number;
  commission_total: number;
  avg_ticket: number;
};

export function SellerLeaderboard({ role }: { role: Role }) {
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
      <div className="mb-3 flex items-center gap-2">
        <Crown className="h-5 w-5 text-gray-700" />
        <h3 className="text-base font-semibold text-gray-900">Mejores vendedores</h3>
        <span className="text-sm text-gray-500">(Top 5)</span>
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
              className="flex items-center justify-between rounded-xl border p-3"
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700 font-semibold">
                    #{idx + 1}
                    </div>

                    <div className="font-semibold text-gray-900">{generalStringFormat(r.name)}</div>
                </div>

                <div className="grid grid-cols-4 gap-6 text-right">
                <MetricCol label="Ventas" value={r.sales_count} />
                <MetricCol
                    label="Vendido"
                    value={`$${r.total_sold.toLocaleString("es-AR")}`}
                />
                <MetricCol
                    label="Comisión"
                    value={`$${r.commission_total.toLocaleString("es-AR")}`}
                />
                <MetricCol
                    label="Ticket prom."
                    value={`$${r.avg_ticket.toLocaleString("es-AR")}`}
                />
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
    <div className="flex flex-col items-end">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-sm font-semibold text-gray-900">
        {value}
      </span>
    </div>
  );
}