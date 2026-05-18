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

const defaultData = [
  { month: "Jan", revenue: 8200, profit: 3200 },
  { month: "Feb", revenue: 9100, profit: 3800 },
  { month: "Mar", revenue: 7800, profit: 2900 },
  { month: "Apr", revenue: 10500, profit: 4200 },
  { month: "May", revenue: 12450, profit: 5100 },
];

export function RevenueTrendChart({ data }: { data?: any[] }) {
  const chartData = data && data.length > 0
    ? data.map((d: any) => ({
        month: new Date(d.date).toLocaleDateString("en", { month: "short" }),
        revenue: d.revenue || 0,
        profit: d.profit || 0,
      }))
    : defaultData;

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v / 1000}k`} />
          <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))" }} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="hsl(var(--primary) / 0.1)" />
          <Area type="monotone" dataKey="profit" stroke="hsl(var(--success))" strokeWidth={2} fill="hsl(var(--success) / 0.1)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
