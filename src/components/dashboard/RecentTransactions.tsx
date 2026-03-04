import { Badge } from "@/components/ui/badge";

const transactions = [
  { id: "INV-001", date: "04 Mar 2026", customer: "Rajesh Traders", mode: "Cash", amount: "₹12,500", status: "Paid" },
  { id: "INV-002", date: "04 Mar 2026", customer: "Priya Stores", mode: "UPI", amount: "₹8,300", status: "Paid" },
  { id: "INV-003", date: "03 Mar 2026", customer: "Kumar & Sons", mode: "Credit", amount: "₹24,800", status: "Pending" },
  { id: "INV-004", date: "03 Mar 2026", customer: "Anita Enterprises", mode: "Bank", amount: "₹15,600", status: "Paid" },
  { id: "INV-005", date: "02 Mar 2026", customer: "Sharma Brothers", mode: "Cash", amount: "₹6,200", status: "Overdue" },
];

export default function RecentTransactions() {
  return (
    <div className="stat-card p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Recent Transactions</h3>
        <button className="text-xs text-primary font-medium hover:underline">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
              <th className="text-left px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mode</th>
              <th className="text-right px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-center px-5 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="px-5 py-3 text-muted-foreground">{tx.date}</td>
                <td className="px-5 py-3 font-medium text-primary">{tx.id}</td>
                <td className="px-5 py-3 text-foreground">{tx.customer}</td>
                <td className="px-5 py-3 text-muted-foreground">{tx.mode}</td>
                <td className="px-5 py-3 text-right font-semibold text-foreground">{tx.amount}</td>
                <td className="px-5 py-3 text-center">
                  <Badge
                    variant={tx.status === "Paid" ? "default" : tx.status === "Pending" ? "secondary" : "destructive"}
                    className="text-[10px] px-2"
                  >
                    {tx.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
