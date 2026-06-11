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

export interface BarDatum {
  name: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  color?: string;
  label?: string;
}

export function HorizontalBarChart({
  data,
  color = "#4f46e5",
  label = "Say",
}: HorizontalBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e4e4e7" />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#71717a" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={150}
          tick={{ fontSize: 12, fill: "#3f3f46" }}
        />
        <Tooltip
          cursor={{ fill: "#f4f4f5" }}
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
        />
        <Bar
          dataKey="value"
          name={label}
          fill={color}
          radius={[0, 4, 4, 0]}
          barSize={18}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
