import { type LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
  return (
    <div className="rounded-2xl border bg-white px-3 py-3 shadow-sm">
      <div className="flex flex-col gap-2">
        <div className="flex flex-row gap-2 items-center">
          <div className="flex aspect-square w-12 md:w-1/6 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Icon className="h-4 w-4" />
          </div>
          <div className="text-sm text-gray-500">{label}</div>
        </div>
        <div className="flex">
          <span className="text-lg md:text-lg font-semibold text-gray-900 tabular-nums">
            {value}
          </span>
        </div>

      </div>
    </div>
  );
}
