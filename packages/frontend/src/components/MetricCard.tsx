import { type LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
};

export function MetricCard({ label, value, icon: Icon }: MetricCardProps) {
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
