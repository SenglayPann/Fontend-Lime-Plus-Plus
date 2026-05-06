"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

const COLORS = ["oklch(0.85 0.25 140)", "oklch(0.7 0.2 160)", "oklch(0.6 0.15 180)", "oklch(0.9 0.15 120)"];

interface TeamPerformanceBarProps {
  data: { name: string; score: number }[];
}

export function TeamPerformanceBar({ data }: TeamPerformanceBarProps) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "var(--foreground)", fontSize: 12, fontWeight: 500 }} 
          />
          <Tooltip 
            cursor={{ fill: "transparent" }}
            contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--border)", borderRadius: "8px" }}
            itemStyle={{ color: "var(--foreground)" }}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
