import { useEffect, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import {
  ShoppingCart,
  DollarSign,
  Percent,
  TrendingUp,
} from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import type { TenantRole } from "@server/db/types";

type Metrics = {
  sales_count: number;
  total_sold_formatted: string;
  commission_total_formatted: string;
  avg_ticket_formatted: string;
};

export function SellerMetricsOverview({ role }: { role: TenantRole }) {
  if (role !== "owner") return null;
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientApp.seller.metrics.overview.get();
        if (res.data) setData(res.data);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl border bg-white p-4 shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      <MetricCard
        label="Ventas totales"
        value={data.sales_count}
        icon={ShoppingCart}
      />

      <MetricCard
        label="Total vendido"
        value={data.total_sold_formatted}
        icon={DollarSign}
      />

      <MetricCard
        label="Comisión total"
        value={data.commission_total_formatted}
        icon={Percent}
      />

      <MetricCard
        label="Ticket promedio"
        value={data.avg_ticket_formatted}
        icon={TrendingUp}
      />
    </div>
  );
}
