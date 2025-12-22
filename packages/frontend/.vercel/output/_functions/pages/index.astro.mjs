/* empty css                                 */
import { e as createComponent, f as createAstro, h as addAttribute, l as renderHead, k as renderComponent, n as renderSlot, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CHQc_UcV.mjs';
import 'piccolore';
import { $ as $$Header, b as background, a as cn, c as clientApp, S as SalesDataByMonth, i as createSvgComponent, s as serverApp, g as generalStringFormat } from '../chunks/formatters_DicF_a8O.mjs';
/* empty css                                 */
/* empty css                                 */
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Chart } from 'react-google-charts';
import * as React from 'react';
import { useState, useEffect } from 'react';
import * as RechartsPrimitive from 'recharts';
import { BarChart, CartesianGrid, XAxis, Bar } from 'recharts';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$LayoutDashboard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$LayoutDashboard;
  const { title } = Astro2.props;
  return renderTemplate`<html class="scroll-smooth" lang="en" data-astro-cid-3tem2lmw> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/png" href="/nowaste-icon.png"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body class="min-h-screen w-full" data-astro-cid-3tem2lmw> ${renderComponent($$result, "Header", $$Header, { "data-astro-cid-3tem2lmw": true })} <img id="background"${addAttribute(background.src, "src")} alt="" fetchpriority="high" data-astro-cid-3tem2lmw> <!-- Main content container --> <main class="min-h-screen w-full pt-[var(--header-height)] p-3" data-astro-cid-3tem2lmw> <!-- Header container slot --> ${renderSlot($$result, $$slots["header-container"])} <!-- Main content area with column structure --> <div class="flex min-h-[calc(100vh-var(--header-height))] flex-col md:flex-row" data-astro-cid-3tem2lmw> <!-- First column --> <div class="p-2 lg:w-1/6 md:p-4" data-astro-cid-3tem2lmw> ${renderSlot($$result, $$slots["primer-columna"], renderTemplate` <!-- Contenido de la primera columna --> `)} </div> <!-- Main content column --> <div class="relative w-full p-2 lg:w-5/6 md:p-4" data-astro-cid-3tem2lmw> ${renderSlot($$result, $$slots["default"], renderTemplate` <!-- Contenido principal --> `)} </div> </div> </main> </body></html>`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/layouts/LayoutDashboard.astro", void 0);

function StatCard({ title, amount, icon, secondaryData }) {
  const iconSrc = typeof icon === "string" ? icon : icon?.src;
  return /* @__PURE__ */ jsx("div", { className: " w-full h-32 rounded-2xl border-black bg-white p-4 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-row h-full w-full items-center", children: [
    /* @__PURE__ */ jsx("div", { className: "flex md:h-1/2 lg:h-3/4 aspect-square rounded-2xl bg-gray-300 opacity-85 shadow-lg items-center justify-center", children: iconSrc && /* @__PURE__ */ jsx("img", { src: iconSrc, className: "h-1/2 w-1/2 fill-current", alt: "" }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 text-sm font-normal text-black w-full p-3", children: [
      title,
      /* @__PURE__ */ jsxs("div", { className: "lg:text-xl md:text-lg font-extrabold text-gray-700", children: [
        secondaryData && /* @__PURE__ */ jsx("div", { className: "md:text-lg lg:text-xl font-bold text-gray-900", dangerouslySetInnerHTML: { __html: secondaryData } }),
        /* @__PURE__ */ jsx("p", { className: "md:text-lg lg:text-xl font-bold text-gray-900", children: amount })
      ] })
    ] })
  ] }) });
}

const customColors = [
  "#004aad",
  "#275fa8",
  "#3b69a6",
  "#4e72a2",
  "#627c9f"
];
const options = {
  backgroundColor: "transparent",
  title: "Productos más vendidos",
  pieHole: 0.25,
  is3D: false,
  colors: customColors,
  titleTextStyle: {
    fontSize: 20,
    bold: true,
    color: "#374151",
    textAlign: "center"
  },
  legend: {
    position: "right",
    alignment: "center",
    textStyle: {
      color: "black",
      fontSize: 10
    }
  }
};
function PieChart({ data, className }) {
  return /* @__PURE__ */ jsx(
    Chart,
    {
      className,
      chartType: "PieChart",
      width: "100%",
      height: "300px",
      data,
      options
    }
  );
}

const THEMES = { light: "", dark: ".dark" };
const ChartContext = React.createContext(null);
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}
const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return /* @__PURE__ */ jsx(ChartContext.Provider, { value: { config }, children: /* @__PURE__ */ jsxs(
    "div",
    {
      "data-chart": chartId,
      ref,
      className: cn(
        "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
        className
      ),
      ...props,
      children: [
        /* @__PURE__ */ jsx(ChartStyle, { id: chartId, config }),
        /* @__PURE__ */ jsx(RechartsPrimitive.ResponsiveContainer, { children })
      ]
    }
  ) });
});
ChartContainer.displayName = "Chart";
const ChartStyle = ({ id, config }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config2]) => config2.theme || config2.color
  );
  if (!colorConfig.length) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: Object.entries(THEMES).map(
          ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig.map(([key, itemConfig]) => {
            const color = itemConfig.theme?.[theme] || itemConfig.color;
            return color ? `  --color-${key}: ${color};` : null;
          }).join("\n")}
}
`
        ).join("\n")
      }
    }
  );
};
const ChartTooltip = RechartsPrimitive.Tooltip;
const ChartTooltipContent = React.forwardRef(
  ({
    active,
    payload,
    className,
    indicator = "dot",
    hideLabel = false,
    hideIndicator = false,
    label,
    labelFormatter,
    labelClassName,
    formatter,
    color,
    nameKey,
    labelKey
  }, ref) => {
    const { config } = useChart();
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }
      const [item] = payload;
      const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value = !labelKey && typeof label === "string" ? config[label]?.label || label : itemConfig?.label;
      if (labelFormatter) {
        return /* @__PURE__ */ jsx("div", { className: cn("font-medium", labelClassName), children: labelFormatter(value, payload) });
      }
      if (!value) {
        return null;
      }
      return /* @__PURE__ */ jsx("div", { className: cn("font-medium", labelClassName), children: value });
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey
    ]);
    if (!active || !payload?.length) {
      return null;
    }
    const nestLabel = payload.length === 1 && indicator !== "dot";
    return /* @__PURE__ */ jsxs(
      "div",
      {
        ref,
        className: cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        ),
        children: [
          !nestLabel ? tooltipLabel : null,
          /* @__PURE__ */ jsx("div", { className: "grid gap-1.5", children: payload.filter((item) => item.type !== "none").map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const indicatorColor = color || item.payload.fill || item.color;
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center"
                ),
                children: formatter && item?.value !== void 0 && item.name ? formatter(item.value, item.name, item, index, item.payload) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  itemConfig?.icon ? /* @__PURE__ */ jsx(itemConfig.icon, {}) : !hideIndicator && /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: cn(
                        "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                        {
                          "h-2.5 w-2.5": indicator === "dot",
                          "w-1": indicator === "line",
                          "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                          "my-0.5": nestLabel && indicator === "dashed"
                        }
                      ),
                      style: {
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor
                      }
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center"
                      ),
                      children: [
                        /* @__PURE__ */ jsxs("div", { className: "grid gap-1.5", children: [
                          nestLabel ? tooltipLabel : null,
                          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: itemConfig?.label || item.name })
                        ] }),
                        item.value && /* @__PURE__ */ jsx("span", { className: "font-mono font-medium tabular-nums text-foreground", children: item.value.toLocaleString() })
                      ]
                    }
                  )
                ] })
              },
              item.dataKey
            );
          }) })
        ]
      }
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltip";
const ChartLegend = RechartsPrimitive.Legend;
const ChartLegendContent = React.forwardRef(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart();
    if (!payload?.length) {
      return null;
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        ref,
        className: cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        ),
        children: payload.filter((item) => item.type !== "none").map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          return /* @__PURE__ */ jsxs(
            "div",
            {
              className: cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              ),
              children: [
                itemConfig?.icon && !hideIcon ? /* @__PURE__ */ jsx(itemConfig.icon, {}) : /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-2 w-2 shrink-0 rounded-[2px]",
                    style: {
                      backgroundColor: item.color
                    }
                  }
                ),
                itemConfig?.label
              ]
            },
            item.value
          );
        })
      }
    );
  }
);
ChartLegendContent.displayName = "ChartLegend";
function getPayloadConfigFromPayload(config, payload, key) {
  if (typeof payload !== "object" || payload === null) {
    return void 0;
  }
  const payloadPayload = "payload" in payload && typeof payload.payload === "object" && payload.payload !== null ? payload.payload : void 0;
  let configLabelKey = key;
  if (key in payload && typeof payload[key] === "string") {
    configLabelKey = payload[key];
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key];
  }
  return configLabelKey in config ? config[configLabelKey] : config[key];
}

const chartConfig = {
  count: {
    label: "Ventas",
    color: "#2563eb"
  }
};
function SalesChart({ data }) {
  return /* @__PURE__ */ jsx(ChartContainer, { config: chartConfig, className: "min-h-[200px] m-2 w-full", children: /* @__PURE__ */ jsxs(BarChart, { accessibilityLayer: true, data, children: [
    /* @__PURE__ */ jsx(CartesianGrid, { vertical: false }),
    /* @__PURE__ */ jsx(
      XAxis,
      {
        dataKey: "month",
        tickLine: false,
        tickMargin: 10,
        axisLine: false,
        tickFormatter: (value) => value.slice(0, 3)
      }
    ),
    /* @__PURE__ */ jsx(ChartTooltip, { content: /* @__PURE__ */ jsx(ChartTooltipContent, {}) }),
    /* @__PURE__ */ jsx(ChartLegend, { content: /* @__PURE__ */ jsx(ChartLegendContent, {}) }),
    /* @__PURE__ */ jsx(Bar, { dataKey: "count", fill: "var(--color-count)", radius: 4 })
  ] }) });
}

function SalesAnnualSection({ initialYear, initialData }) {
  const [year, setYear] = useState(initialYear);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  async function loadYear(y) {
    setLoading(true);
    try {
      const res = await clientApp.sale["sales-by-month"].get({
        query: { year: String(y) }
      });
      const formatted = SalesDataByMonth(res.data ?? []);
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
  }, [year]);
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-row w-full bg-white p-3 pr-5 rounded-2xl shadow-lg", children: [
    /* @__PURE__ */ jsxs("div", { className: "w-3/5 m-3 space-y-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-gray-700 font-bold text-2xl", children: "Ventas Anuales" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 font-medium text-xs", children: "Elegir año para ver la cantidad de ventas por mes" }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 pt-5", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-[0.98]",
            onClick: () => setYear((v) => v - 1),
            "aria-label": "Año anterior",
            children: "←"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "text-sm font-semibold text-gray-700", children: [
          year,
          loading && /* @__PURE__ */ jsx("span", { className: "text-gray-400 text-xs", children: " Cargando…" })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 active:scale-[0.98]",
            onClick: () => setYear((v) => v + 1),
            "aria-label": "Año siguiente",
            children: "→"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "w-2/5 bg-white hover:bg-gray-50 rounded-2xl", children: /* @__PURE__ */ jsx(SalesChart, { data }) })
  ] });
}

const moneyIcon = createSvgComponent({"meta":{"src":"/_astro/money-income.Cpp73Fcx.svg","width":24,"height":24,"format":"svg"},"attributes":{"id":"Layer_1","data-name":"Layer 1","viewBox":"0 0 24 24"},"children":"\n  <path d=\"M17.762,9c-1.67,0-3.141,.335-4.238,.893V4.5c0-2.298-3.401-3.5-6.762-3.5S0,2.202,0,4.5V20.5c0,2.298,3.401,3.5,6.762,3.5,2.236,0,4.484-.535,5.742-1.568,1.089,.957,2.995,1.568,5.258,1.568,3.557,0,6.238-1.505,6.238-3.5V12.5c0-1.995-2.682-3.5-6.238-3.5Zm4.238,7.5c0,.515-1.65,1.5-4.238,1.5s-4.238-.985-4.238-1.5v-1.393c1.097,.558,2.569,.893,4.238,.893s3.141-.335,4.238-.893v1.393ZM11.523,8.5c0,.386-1.638,1.5-4.762,1.5s-4.762-1.114-4.762-1.5v-1.45c1.283,.627,3.026,.95,4.762,.95s3.479-.323,4.762-.95v1.45Zm-4.762,3.5c1.736,0,3.479-.323,4.762-.95v1.45c0,.386-1.638,1.5-4.762,1.5s-4.762-1.114-4.762-1.5v-1.45c1.283,.627,3.026,.95,4.762,.95Zm-4.762,3.05c1.283,.627,3.026,.95,4.762,.95s3.479-.323,4.762-.95v1.45c0,.386-1.638,1.5-4.762,1.5s-4.762-1.114-4.762-1.5v-1.45Zm15.762-4.05c2.588,0,4.238,.985,4.238,1.5s-1.65,1.5-4.238,1.5-4.238-.985-4.238-1.5,1.65-1.5,4.238-1.5ZM6.762,3c3.124,0,4.762,1.114,4.762,1.5s-1.638,1.5-4.762,1.5-4.762-1.114-4.762-1.5,1.638-1.5,4.762-1.5Zm0,19c-3.124,0-4.762-1.114-4.762-1.5v-1.45c1.283,.627,3.026,.95,4.762,.95s3.479-.323,4.762-.95v1.45c0,.386-1.638,1.5-4.762,1.5Zm11,0c-2.588,0-4.238-.985-4.238-1.5v-1.393c1.097,.558,2.569,.893,4.238,.893s3.141-.335,4.238-.893v1.393c0,.515-1.65,1.5-4.238,1.5ZM15.588,3.953c-.388-.393-.384-1.026,.01-1.414l1.984-1.959c.771-.771,2.033-.771,2.812,.004l2.003,1.951c.396,.385,.404,1.018,.02,1.414-.387,.395-1.019,.404-1.414,.019l-1.003-.976V7c0,.552-.447,1-1,1s-1-.448-1-1V2.98c-.391,.316-1.119,1.345-1.7,1.27-.258,0-.516-.099-.712-.297Z\" />\n"});

const devicesIcon = createSvgComponent({"meta":{"src":"/_astro/devices.DE3GIESY.svg","width":512,"height":512,"format":"svg"},"attributes":{"id":"Layer_1","data-name":"Layer 1","viewBox":"0 0 24 24","width":"512","height":"512"},"children":"<path d=\"M2,16H12v6H6v-2h4v-2H0V4C0,2.35,1.35,1,3,1H19c1.65,0,3,1.35,3,3v3h-2v-3c0-.55-.45-1-1-1H3c-.55,0-1,.45-1,1v12Zm22-4v12H14V12c0-1.65,1.35-3,3-3h4c1.65,0,3,1.35,3,3Zm-2,0c0-.55-.45-1-1-1h-4c-.55,0-1,.45-1,1v10h6V12Z\" />"});

const grossincome = createSvgComponent({"meta":{"src":"/_astro/gross-income.Dmp8UTuW.svg","width":24,"height":24,"format":"svg"},"attributes":{"id":"Layer_1","data-name":"Layer 1","viewBox":"0 0 24 24"},"children":"\n  <path d=\"M15.449,4.523l-1.414-1.414,2.514-2.514c.791-.792,2.08-.792,2.871,0l2.529,2.529-1.414,1.414-1.535-1.535v4.997h-2V2.998l-1.551,1.525Zm-9.449,3.477c3.314,0,6-1.343,6-3s-2.686-3-6-3S0,3.343,0,5s2.686,3,6,3Zm0,8c3.421,0,6-1.505,6-3.5v-2c0,1.971-2.5,3.5-6,3.5S0,12.471,0,10.5v2c0,1.995,2.579,3.5,6,3.5Zm0-4c3.421,0,6-1.505,6-3.5v-2c0,1.971-2.5,3.5-6,3.5S0,8.471,0,6.5v2c0,1.995,2.579,3.5,6,3.5Zm12,4c3.314,0,6-1.343,6-3s-2.686-3-6-3-6,1.343-6,3,2.686,3,6,3Zm0,6c-3.5,0-6-1.529-6-3.5,0,1.971-2.5,3.5-6,3.5s-6-1.529-6-3.5v2c0,1.995,2.579,3.5,6,3.5s6-1.505,6-3.5c0,1.995,2.579,3.5,6,3.5s6-1.505,6-3.5v-2c0,1.971-2.5,3.5-6,3.5Zm0-4c-3.5,0-6-1.529-6-3.5,0,1.971-2.5,3.5-6,3.5S0,16.471,0,14.5v2c0,1.995,2.579,3.5,6,3.5s6-1.505,6-3.5c0,1.995,2.579,3.5,6,3.5s6-1.505,6-3.5v-2c0,1.971-2.5,3.5-6,3.5Z\" />\n"});

const expenseIcon = createSvgComponent({"meta":{"src":"/_astro/expense.BukrIwx9.svg","width":24,"height":24,"format":"svg"},"attributes":{"id":"Layer_1","data-name":"Layer 1","viewBox":"0 0 24 24"},"children":"\n  <path d=\"m23.018,8.785c-.595-.542-1.356-.821-2.169-.782-.804.037-1.545.386-2.085.981l-3.217,3.534c-.551-.91-1.551-1.519-2.689-1.519h-3.857v-1h.376c1.447,0,2.624-1.177,2.624-2.624,0-1.288-.923-2.377-2.193-2.588l-3.285-.548c-.302-.05-.521-.309-.521-.616,0-.344.28-.624.624-.624h2.376c.552,0,1,.449,1,1h2c0-1.654-1.346-3-3-3V0h-2v1h-.376c-1.447,0-2.624,1.177-2.624,2.624,0,1.288.923,2.377,2.193,2.588l3.285.548c.302.05.521.309.521.616,0,.344-.28.624-.624.624h-2.376c-.552,0-1-.449-1-1h-2c0,1.654,1.346,3,3,3v1H3c-1.654,0-3,1.346-3,3v7c0,1.654,1.346,3,3,3h10.448l9.787-10.985c1.094-1.225.996-3.123-.218-4.23Zm-1.275,2.899l-9.19,10.316H3c-.552,0-1-.449-1-1v-7c0-.551.448-1,1-1h9.857c.63,0,1.143.512,1.143,1.142,0,.564-.422,1.051-.98,1.131l-5.161.737.283,1.979,5.161-.737c1.175-.168,2.129-.988,2.514-2.059l4.427-4.864c.181-.2.43-.316.699-.329.271-.007.528.082.728.262.407.372.44,1.009.072,1.421Zm-3.716-6.668h-4.026v-2h4.058l-1.537-1.538,1.414-1.414,2.448,2.449c.397.396.616.924.616,1.486s-.219,1.09-.616,1.487l-2.49,2.49-1.414-1.414,1.546-1.546Z\" />\n"});

const debtIcon = createSvgComponent({"meta":{"src":"/_astro/debt.Bx92wyyy.svg","width":24,"height":24,"format":"svg"},"attributes":{"id":"Layer_1","data-name":"Layer 1","viewBox":"0 0 24 24"},"children":"\n  <path d=\"m23.949,18.293l-1.284-9c-.35-2.447-2.478-4.293-4.95-4.293h-2.566c.219-.456.351-.961.351-1.5,0-1.93-1.57-3.5-3.5-3.5s-3.5,1.57-3.5,3.5c0,.539.133,1.044.351,1.5h-2.491c-2.493,0-4.572,1.789-4.944,4.254L.057,18.254c-.218,1.441.202,2.901,1.153,4.007.951,1.105,2.333,1.739,3.791,1.739h13.998c1.45,0,2.827-.628,3.777-1.724.95-1.095,1.377-2.547,1.173-3.983ZM10.5,3.5c0-.827.673-1.5,1.5-1.5s1.5.673,1.5,1.5-.673,1.5-1.5,1.5-1.5-.673-1.5-1.5Zm10.766,17.466c-.57.657-1.396,1.034-2.267,1.034H5.001c-.875,0-1.704-.381-2.274-1.044s-.823-1.539-.692-2.403l1.358-9c.223-1.479,1.471-2.553,2.967-2.553h11.355c1.483,0,2.761,1.107,2.97,2.576l1.284,9c.123.861-.134,1.732-.703,2.39Zm-9.266,1.034c-.552,0-1-.447-1-1v-1h-.268c-1.067,0-2.063-.574-2.598-1.499-.276-.479-.113-1.09.365-1.366.477-.278,1.089-.114,1.366.364.179.31.511.501.867.501h2.268c.552,0,1-.448,1-1,0-.379-.271-.698-.645-.761l-3.04-.506c-1.342-.224-2.315-1.374-2.315-2.733,0-1.654,1.346-3,3-3v-1c0-.553.448-1,1-1s1,.447,1,1v1h.268c1.067,0,2.063.574,2.598,1.499.277.479.113,1.09-.364,1.366-.48.278-1.092.112-1.366-.364-.179-.31-.511-.501-.867-.501h-2.268c-.551,0-1,.448-1,1,0,.379.271.698.644.761l3.041.506c1.342.224,2.315,1.374,2.315,2.733,0,1.654-1.346,3-3,3v1c0,.553-.448,1-1,1Z\" />\n"});

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const resultGross = await serverApp.sale["gross-income"].get();
  const gross_income = String(resultGross.data);
  const resultNet = await serverApp.sale["net-income"].get();
  const net_income = String(resultNet.data);
  const saleData = await serverApp.sale.all.get({ query: { is_deleted: false } });
  const units_sold_count = saleData.data?.length ?? 0;
  const expenseData = await serverApp.expense["expenses"].get();
  const expensesFormatted = expenseData.data || [];
  const initialYear = (/* @__PURE__ */ new Date()).getFullYear();
  const saleDataByMonth = await serverApp.sale["sales-by-month"].get({
    query: { year: String(initialYear) }
  });
  const saleDataFormatted = SalesDataByMonth(saleDataByMonth.data || []) || [];
  const deudoresCount = await serverApp.client["debts"].get();
  const deudoresCountFormatted = deudoresCount.data?.length || 0;
  const totalDebt = await serverApp.client["total-debt"].get();
  const totalDebtFormatted = totalDebt.data || 0;
  const phoneSoldCount = await serverApp.sale["products-sold-count"].get();
  const phoneSoldCountFormatted = phoneSoldCount.data || [];
  const formattedDataName = phoneSoldCountFormatted.map((item) => ({
    ...item,
    name: generalStringFormat(item.name)
  }));
  const pieChartData = [
    ["Producto", "Unidades Vendidas"],
    ...formattedDataName.map((item) => [item.name, item.sold_count])
  ];
  const secondaryData = `
    <div>
        <p>${deudoresCountFormatted}</p>
    </div>
`;
  return renderTemplate`${renderComponent($$result, "LayoutDashboard", $$LayoutDashboard, { "title": "StockManagement" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="px-3 w-full text-left text-4xl text-gray-700 font-bold mt-5 mb-2">Dashboard</h1> <p class="px-3 mb-8 text-sm text-gray-600 font-medium">Resumen completo de tu negocio con métricas clave</p> <div class="px-3 grid grid-cols-4 gap-3 mb-4"> ${renderComponent($$result2, "CustomCard", StatCard, { "title": "Unidades Vendidas", "amount": String(units_sold_count), "icon": devicesIcon })} ${renderComponent($$result2, "CustomCard", StatCard, { "title": "Ingresos Netos", "amount": `$${net_income}`, "icon": moneyIcon })} ${renderComponent($$result2, "CustomCard", StatCard, { "title": "Ingresos Brutos", "amount": `$${gross_income}`, "icon": grossincome })} ${renderComponent($$result2, "CustomCard", StatCard, { "title": "Gastos Totales", "amount": `$${expensesFormatted}`, "icon": expenseIcon })} </div> <div class="px-3"> ${renderComponent($$result2, "SalesAnnualSection", SalesAnnualSection, { "client:load": true, "initialYear": initialYear, "initialData": saleDataFormatted, "client:component-hydration": "load", "client:component-path": "@/components/SalesAnnualSection", "client:component-export": "SalesAnnualSection" })} </div> <div class="flex flex-row gap-3 mt-4 px-3 mb-10"> <div class="flex justify-center w-1/2 p-3 bg-white hover:bg-gray-50 rounded-2xl shadow-lg"> ${renderComponent($$result2, "PieChart", PieChart, { "data": pieChartData, "className": "flex justify-center", "client:load": true, "client:component-hydration": "load", "client:component-path": "@/components/PieChart", "client:component-export": "PieChart" })} </div> <div class="w-1/2"> ${renderComponent($$result2, "CustomCard", StatCard, { "title": "Deudores", "amount": `$${totalDebtFormatted}`, "secondaryData": secondaryData, "icon": debtIcon })} </div> </div> ` })}`;
}, "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/index.astro", void 0);

const $$file = "/Users/estebanfernandez/Documents/Projects/StockManagement/Stock-Management-System/packages/frontend/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
