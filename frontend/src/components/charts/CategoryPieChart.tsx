"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const categoryData = [
  { name: "Electronics", value: 45 },
  { name: "Fashion", value: 25 },
  { name: "Home & Garden", value: 15 },
  { name: "Sports", value: 10 },
  { name: "Other", value: 5 },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function CategoryPieChart() {
  return (
    <>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
              {categoryData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 mt-2">
        {categoryData.map((cat, i) => (
          <div key={cat.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-muted-foreground">{cat.name}</span>
            </div>
            <span className="font-medium">{cat.value}%</span>
          </div>
        ))}
      </div>
    </>
  );
}
