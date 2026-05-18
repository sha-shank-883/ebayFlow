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
  { date: "Mon", revenue: 420 },
  { date: "Tue", revenue: 580 },
  { date: "Wed", revenue: 350 },
  { date: "Thu", revenue: 720 },
  { date: "Fri", revenue: 890 },
  { date: "Sat", revenue: 650 },
  { date: "Sun", revenue: 510 },
];

export function RevenueChart({ data }: { data?: any[] }) {
  const chartData = data && data.length > 0
    ? data.map((d: any) => ({
        date: new Date(d.date).toLocaleDateString("en", { weekday: "short" }),
        revenue: d.revenue || 0,
      }))
    : defaultData;

  return (
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(221 83% 53% / 0.3)" />
              <stop offset="95%" stopColor="hsl(221 83% 53% / 0)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}`} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
          />
          <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
