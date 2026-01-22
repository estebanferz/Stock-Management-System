import { Chart } from "react-google-charts";

const customColors = [
  "#204e22",
  "#3d8f41",
  "#53c259",
  "#55d85d",
  "#63ff6c",
];

export const options = {
  backgroundColor: "transparent",
  pieHole: 0.25,
  is3D: false,
  colors: customColors,
  legend: {
    position: "right",
    alignment: "center",
    textStyle: {
      color: "black",
      fontSize: 10,
    },
  },
};

type PieChartItem = [string, number];

type PieChartProps = {
  data: PieChartItem[] | undefined;
  className?: string;
  title?: string;
  description?: string;
  width?: string | number; 
  height?: string | number;
};

export function PieChart({
  data,
  className,
  title = "Productos más vendidos",
  description = "Distribución de unidades vendidas por producto",
  width = "100%",
  height = "300px",
}: PieChartProps) {
  return (
    <div className={`w-full flex flex-col ${className ?? ""}`}>
      <h3 className="text-base font-semibold text-gray-800 text-left">
        {title}
      </h3>

      <p className="text-sm text-gray-600 text-left mb-2">
        {description}
      </p>

      <Chart
        chartType="PieChart"
        width={width}
        height={height}
        data={data}
        options={options}
      />
    </div>
  );
}
