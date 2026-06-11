"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { BarDatum } from "./horizontal-bar-chart";

interface VerticalBarChartProps {
  data: BarDatum[];
  color?: string;
  label?: string;
}

export function VerticalBarChart({
  data,
  color = "#4f46e5",
  label = "Say",
}: VerticalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
        <XAxis
          dataKey="name"
          interval={0}
          tick={{ fontSize: 11, fill: "#71717a" }}
        />
        <YAxis
          allowDecimals={false}
          width={32}
          tick={{ fontSize: 12, fill: "#71717a" }}
        />
        <Tooltip
          cursor={{ fill: "#f4f4f5" }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar
          dataKey="value"
          name={label}
          fill={color}
          radius={[4, 4, 0, 0]}
          barSize={36}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
