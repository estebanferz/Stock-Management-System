import { Chart } from "react-google-charts";

const customColors = [
    '#004aad',
    '#275fa8', 
    '#3b69a6', 
    '#4e72a2',
    '#627c9f',
];

export const options = {
  backgroundColor: "transparent",
  title: "Productos más vendidos",
  pieHole: 0.25,
  is3D: false,
  colors: customColors,
  titleTextStyle: {
    fontSize: 20,
    bold: true,  
    color: '#374151',
    textAlign: 'center', 
  },
  legend: {
    position: 'bottom', 
    alignment: 'center',
    textStyle: {
      color: 'black',
      fontSize: 10
    }
  },
};

type PieChartItem = [string, number];

export function PieChart({data, className}: {data: PieChartItem[] | undefined, className?: string}) {
  return (
    <Chart
      className={className}
      chartType="PieChart"
      width="100%"
      height="300px"
      data={data}
      options={options}
    />
  );
}
