"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatMoney } from "@/lib/money";
import type { ForecastResult } from "@/lib/types";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

const config = {
  expected: { label: "Projected balance", color: "var(--chart-1)" },
};

export function ForecastChart({ forecast }: { forecast: ForecastResult }) {
  return (
    <ChartContainer config={config} className="h-[220px] w-full aspect-auto">
      <LineChart data={forecast.days} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={(value: number) => formatMoney(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="text-muted-foreground">{config[name as keyof typeof config]?.label ?? name}</span>
                  <span className="font-mono">{formatMoney(Number(value))}</span>
                </div>
              )}
            />
          }
        />
        <ReferenceLine y={0} stroke="var(--destructive)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="expected"
          stroke="var(--color-expected)"
          strokeWidth={2.5}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
