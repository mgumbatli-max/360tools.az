"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BarDatum } from "./horizontal-bar-chart";

interface DailyAreaChartProps {
  data: BarDatum[];
  color?: string;
  label?: string;
}

export function DailyAreaChart({
  data,
  color = "#4f46e5",
  label = "Kontent",
}: DailyAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="dailyAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#71717a" }} />
        <YAxis
          allowDecimals={false}
          width={32}
          tick={{ fontSize: 12, fill: "#71717a" }}
        />
        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
        <Area
          type="monotone"
          dataKey="value"
          name={label}
          stroke={color}
          strokeWidth={2}
          fill="url(#dailyAreaFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
