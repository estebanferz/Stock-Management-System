import { useEffect, useMemo, useState } from "react";
import { clientApp } from "@/lib/clientAPI";
import { TrendingUp, AlertTriangle } from "lucide-react";

type MonthPoint = {
  day: string; 
  sold_count: number;
};

type SalePublicMetrics = {
  avg_ticket: number;
  debt_sales_count: number;
  month_series: MonthPoint[];
};

export function SaleMetricsOverview() {
  const [data, setData] = useState<SalePublicMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await clientApp.sale.metrics.overview.get();
        if (res.data) setData(res.data as SalePublicMetrics);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartPoints = useMemo(() => {
    if (!data) return [];
    return data.month_series.map((p) => ({
      day: p.day,
      value: Number(p.sold_count ?? 0),
    }));
  }, [data]);

  const monthUnits = useMemo(() => {
    return chartPoints.reduce((acc, p) => acc + (Number.isFinite(p.value) ? p.value : 0), 0);
  }, [chartPoints]);

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="h-28 rounded-2xl border bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-2" />
        <div className="h-28 rounded-2xl border bg-white p-4 shadow-sm" />
        <div className="h-28 rounded-2xl border bg-white p-4 shadow-sm" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-2xl border bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-gray-500">Ventas del mes</div>
            <div className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
              {monthUnits} vendidos
            </div>
          </div>

          <div className="text-xs text-gray-400">
            {monthLabelAR()}
          </div>
        </div>

        <div className="mt-3">
          <MiniLineChart points={chartPoints} />
        </div>

        <div className="mt-2 text-xs text-gray-400">
          Suma diaria de ventas (mes corriente)
        </div>
      </div>

      {/* Card: Ticket promedio */}
      <div className="flex flex-col gap-4 align-stretch">
        <MetricCard
          label="Ticket promedio"
          value={moneyAR(data.avg_ticket)}
          icon={TrendingUp}
        />

        {/* Card: Ventas con deuda */}
        <MetricCard
          label="Ventas con deuda"
          value={data.debt_sales_count}
          icon={AlertTriangle}
        />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: any;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-500">{label}</span>
          <span className="text-2xl font-semibold text-gray-900 tabular-nums">
            {value}
          </span>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function MiniLineChart({
  points,
}: {
  points: { day: string; value: number }[];
}) {
  const w = 520;
  const h = 72;
  const padX = 8;
  const padY = 8;

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number>(0);
  const [hoverY, setHoverY] = useState<number>(0);

  if (!points.length) {
    return <div className="h-[72px] rounded-xl bg-gray-50 border" />;
  }

  const values = points.map((p) => (Number.isFinite(p.value) ? p.value : 0));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const xAt = (i: number) =>
    padX + (i * (w - padX * 2)) / Math.max(1, points.length - 1);

  const yAt = (v: number) =>
    padY + (h - padY * 2) * (1 - (v - min) / range);

  const coords = points.map((p, i) => {
    const x = xAt(i);
    const y = yAt(values[i]);
    return { x, y, day: p.day, value: values[i] };
  });

  const poly = coords.map((c) => `${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * w;

    // índice más cercano por X
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < coords.length; i++) {
      const d = Math.abs(coords[i].x - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }

    setHoverIdx(best);
    setHoverX(coords[best].x);
    setHoverY(coords[best].y);
  }

  function onLeave() {
    setHoverIdx(null);
  }

  const hovered = hoverIdx !== null ? coords[hoverIdx] : null;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[72px] rounded-xl border bg-gray-50"
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-700"
          points={poly}
        />

        {hovered && (
          <>
            <line
              x1={hoverX}
              x2={hoverX}
              y1={padY}
              y2={h - padY}
              className="stroke-mainColor"
              strokeWidth="1"
            />
            <circle
              cx={hoverX}
              cy={hoverY}
              r="3.4"
              className="fill-mainColor"
            />
          </>
        )}
      </svg>

      {/* Tooltip HTML */}
      {hovered && (
        <div
          className="pointer-events-none absolute -translate-y-full rounded-lg border bg-white px-3 py-2 text-xs shadow-md"
          style={{
            left: `${(hoverX / w) * 100}%`,
            top: `${(hoverY / h) * 100}%`,
            transform: "translate(-110%, 5px)",
          }}
        >
          <div className="font-medium text-gray-900">
            {formatDayAR(hovered.day)}
          </div>
          <div className="text-gray-600">
            {hovered.value} vendido{hovered.value === 1 ? "" : "s"}
          </div>
        </div>
      )}
    </div>
  );
}

function formatDayAR(dayLike: unknown) {
  let s = "";

  if (dayLike instanceof Date) {
    s = dayLike.toISOString().slice(0, 10);
  } else {
    s = String(dayLike ?? "").slice(0, 10);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return String(dayLike ?? "");

  const [, mm, dd] = s.split("-");
  return `${dd}/${mm}`;
}

function moneyAR(n: number) {
  return `$${Number(n ?? 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function monthLabelAR() {
  const d = new Date();
  return d.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}
