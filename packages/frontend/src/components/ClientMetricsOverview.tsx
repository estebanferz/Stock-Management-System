import { useEffect, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { Users, AlertTriangle, Trophy, ShoppingCart, DollarSign, Clock } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { generalStringFormat } from "@/utils/formatters";

type TopClient = {
  client_id: number;
  name: string;
  sales_count: number;
  total_spent: number;
  total_spent_formatted: string;
  last_sale_datetime: string | null;
};

type Metrics = {
  clients_with_debt: number;
  total_debt: string;
  top_clients: TopClient[];
};

export function ClientMetricsOverview() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientApp.client.metrics.overview.get({
          query: { limit: "5" },
        });
        if (res.data) setData(res.data as Metrics);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border bg-white p-4 shadow-sm" />
          ))}
        </div>

        <div className="mt-4 h-40 rounded-2xl border bg-white p-4 shadow-sm" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Clientes con deuda"
          value={data.clients_with_debt}
          icon={AlertTriangle}
        />

        <MetricCard
          label="Deuda total"
          value={data.total_debt}
          icon={DollarSign}
        />

        <MetricCard
          label="Top clientes (por compras)"
          value={data.top_clients?.length ?? 0}
          icon={Trophy}
        />
      </div>

      {/* Top list */}
      <div className="my-6 rounded-2xl border bg-white p-4 shadow-md">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-700" />
            <h3 className="text-base font-semibold text-gray-900">Top clientes</h3>
          </div>

          <span className="text-sm text-gray-500">Top {data.top_clients.length}</span>
        </div>

        {data.top_clients.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="grid gap-2">
            {data.top_clients.map((c, idx) => (
              <div
                key={c.client_id}
                className="
                  rounded-xl border p-3
                  flex flex-col gap-3
                  md:flex-row md:items-center md:justify-between md:gap-4
                "
              >
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold">
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900">
                      {generalStringFormat(c.name)}
                    </div>
                  </div>
                </div>

                {/* Metrics (con label adentro, sin header) */}
                <div
                  className="
                    w-full
                    grid grid-cols-3 gap-x-6 gap-y-3
                    md:w-auto md:grid-cols-3
                    md:text-right
                  "
                >
                  <MetricCol
                    label="Compras"
                    value={String(c.sales_count)}
                  />
                  <MetricCol
                    label="Total"
                    value={c.total_spent_formatted}
                  />
                  <MetricCol
                    label="Última compra"
                    value={formatDateShort(c.last_sale_datetime)}
                    muted={!c.last_sale_datetime}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


type MetricColProps = {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  muted?: boolean;
};
function MetricCol({ label, value, icon: Icon, muted }: MetricColProps) {
  return (
    <div className="flex flex-col items-start md:items-end gap-0.5">
      <div className="flex items-center gap-1 text-xs text-gray-400">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        <span>{label}</span>
      </div>
      <div className={muted ? "text-sm text-gray-400" : "text-sm font-semibold text-gray-900"}>
        {value}
      </div>
    </div>
  );
}


function formatDateShort(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  // formato corto local (AR): DD/MM
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}
