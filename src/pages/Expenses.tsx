import { Plus, Search, Filter, Download, Wallet, CreditCard, Car, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const expenses = [
  { id: 1, date: "04 Mar 2026", category: "Rent", description: "Office rent March", amount: "₹25,000", mode: "Bank Transfer" },
  { id: 2, date: "04 Mar 2026", category: "Electricity", description: "Electricity bill Feb", amount: "₹3,200", mode: "Online" },
  { id: 3, date: "03 Mar 2026", category: "Transport", description: "Delivery charges", amount: "₹1,800", mode: "Cash" },
  { id: 4, date: "03 Mar 2026", category: "Salary", description: "Staff salary advance", amount: "₹15,000", mode: "Bank Transfer" },
  { id: 5, date: "02 Mar 2026", category: "Office Supplies", description: "Stationery & printing", amount: "₹2,400", mode: "Cash" },
];

const pieData = [
  { name: "Rent", value: 25000, color: "#1565C0" },
  { name: "Salary", value: 15000, color: "#E65100" },
  { name: "Electricity", value: 3200, color: "#F57F17" },
  { name: "Transport", value: 1800, color: "#2E7D32" },
  { name: "Supplies", value: 2400, color: "#6A1B9A" },
];

export default function Expenses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">Track and manage all business expenses</p>
        </div>
        <Button className="gap-2"><Plus className="w-4 h-4" /> Record Expense</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Today</p><p className="text-xl font-bold text-foreground mt-1">₹5,840</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">This Week</p><p className="text-xl font-bold text-foreground mt-1">₹28,200</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">This Month</p><p className="text-xl font-bold text-foreground mt-1">₹1,12,400</p></div>
        <div className="stat-card"><p className="text-xs text-muted-foreground uppercase">Categories</p><p className="text-xl font-bold text-foreground mt-1">12</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 stat-card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search expenses..." className="w-full pl-10 pr-4 py-2 text-sm bg-secondary/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <Button variant="outline" size="sm"><Filter className="w-3.5 h-3.5" /></Button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Category</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Description</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Mode</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-5 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-5 py-3 font-medium text-foreground">{e.category}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.description}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.mode}</td>
                  <td className="px-5 py-3 text-right font-semibold text-foreground">{e.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />{d.name}</span>
                <span className="font-medium">₹{d.value.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
