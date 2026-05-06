"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ActivityLineChartProps {
  data: { date: string; points: number }[];
}

export function ActivityLineChart({ data }: ActivityLineChartProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Line 
            type="monotone" 
            dataKey="points" 
            stroke="oklch(0.85 0.25 140)" 
            strokeWidth={3} 
            dot={{ r: 4, fill: "oklch(0.85 0.25 140)", strokeWidth: 2, stroke: "var(--background)" }}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
