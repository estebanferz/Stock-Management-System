import { useEffect, useState } from "react";
import { SalesChart } from "@/components/SalesChart";
import { clientApp } from "@/lib/clientAPI";
import { SalesDataByMonth } from "@/utils/formatters";

type SaleChart = {
  month: string;
  count: number;
  month_start_date: string;
};

type Props = {
  initialYear: number;
  initialData: SaleChart[];
};

export function SalesAnnualSection({ initialYear, initialData }: Props) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState<SaleChart[]>(initialData);
  const [loading, setLoading] = useState(false);

  async function loadYear(y: number) {
    setLoading(true);
    try {
      const res = await clientApp.sale["sales-by-month"].get({
        query: { year: String(y) },
      });

      const formatted = SalesDataByMonth((res.data as any[]) ?? []) as SaleChart[];
      setData(formatted ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (year === initialYear) {
      setData(initialData);
      return;
    } 
    loadYear(year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  return (
    <div className="flex flex-col md:flex-row w-full bg-white p-3 pr-5 rounded-2xl shadow-lg">
      {/* LEFT: título + descripción + selector */}
      <div className="w-3/5 m-3 space-y-2">
        <h2 className="text-gray-700 font-bold text-2xl">Ventas Anuales</h2>
        <p className="text-gray-600 font-medium text-xs">
          Elegir año para ver la cantidad de ventas por mes
        </p>

        {/* Selector debajo del texto */}
        <div className="flex items-center gap-3 pt-5">
          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-[0.98]"
            onClick={() => setYear((v) => v - 1)}
            aria-label="Año anterior"
          >
            ←
          </button>

          <div className="text-sm font-semibold text-gray-700">
            {year}
            {loading && <span className="text-gray-400 text-xs"> Cargando…</span>}
          </div>

          <button
            type="button"
            className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-[0.98]"
            onClick={() => setYear((v) => v + 1)}
            aria-label="Año siguiente"
          >
            →
          </button>
        </div>
      </div>

      {/* RIGHT: solo el chart */}
      <div className="w-full md:w-2/5 bg-white hover:bg-gray-50 rounded-2xl">
        <SalesChart data={data} />
      </div>
    </div>
  );
}
