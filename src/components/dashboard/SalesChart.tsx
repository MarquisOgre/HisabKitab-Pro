import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

const data = [
  { name: "Mon", sales: 12400, purchases: 8200 },
  { name: "Tue", sales: 18300, purchases: 9100 },
  { name: "Wed", sales: 15600, purchases: 7800 },
  { name: "Thu", sales: 22100, purchases: 11200 },
  { name: "Fri", sales: 19800, purchases: 10500 },
  { name: "Sat", sales: 28400, purchases: 14200 },
  { name: "Sun", sales: 16200, purchases: 6800 },
];

export default function SalesChart() {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Sales Overview</h3>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            Sales
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent" />
            Purchases
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(209, 79%, 28%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(209, 79%, 28%)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 89%)" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(215, 13%, 50%)" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "hsl(215, 13%, 50%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(0, 0%, 100%)",
              border: "1px solid hsl(214, 20%, 89%)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, undefined]}
          />
          <Area type="monotone" dataKey="sales" stroke="hsl(209, 79%, 28%)" strokeWidth={2.5} fill="url(#salesGrad)" />
          <Area type="monotone" dataKey="purchases" stroke="hsl(38, 92%, 50%)" strokeWidth={2.5} fill="url(#purchaseGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
