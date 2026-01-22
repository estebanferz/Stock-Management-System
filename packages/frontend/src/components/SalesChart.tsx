import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type SaleChart = {
  month: string
  count: number
  month_start_date: string
}


const chartConfig = {
  count: {
    label: "Ventas",
    color: "#204e22",
  },
} satisfies ChartConfig


export function SalesChart({ data }: { data?: SaleChart[] }){
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] m-2 w-full">
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false}/>
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
