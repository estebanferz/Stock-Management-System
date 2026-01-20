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
  last_sale_datetime: string | null;
};

type Metrics = {
  clients_with_debt: number;
  total_debt: number;
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
          value={`$${Number(data.total_debt).toLocaleString("es-AR")}`}
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
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-700" />
            <h3 className="text-base font-semibold text-gray-900">Top clientes</h3>
          </div>

          <span className="text-sm text-gray-500">Top {data.top_clients.length}</span>
        </div>

        <div className="mb-2 grid grid-cols-[1fr_420px] gap-6 px-3 text-xs text-gray-400">
          <span>Cliente</span>
          <div className="grid grid-cols-3 gap-6 text-right">
            <span>Compras</span>
            <span>Total</span>
            <span>Última</span>
          </div>
        </div>

        {data.top_clients.length === 0 ? (
          <p className="text-sm text-gray-500">Todavía no hay ventas registradas.</p>
        ) : (
          <div className="grid gap-2">
            {data.top_clients.map((c, idx) => (
              <div key={c.client_id} className="flex items-center justify-between rounded-xl border p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 font-semibold">
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-semibold text-gray-900">{generalStringFormat(c.name)}</div>
                  </div>
                </div>

                <div className="grid w-[420px] grid-cols-3 gap-6 text-right">
                  <MetricCol icon={ShoppingCart} value={String(c.sales_count)} />
                  <MetricCol icon={DollarSign} value={`$${Number(c.total_spent).toLocaleString("es-AR")}`} />
                  <MetricCol
                    icon={Clock}
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


function MetricCol({
  icon: Icon,
  value,
  muted,
}: {
  icon: any;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col items-end">
      <span className={`text-sm font-semibold tabular-nums ${muted ? "text-gray-400" : "text-gray-900"}`}>
        {value}
      </span>
      <div className="mt-1 flex items-center gap-1 text-xs text-gray-400">
        <Icon className="h-3.5 w-3.5" />
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
