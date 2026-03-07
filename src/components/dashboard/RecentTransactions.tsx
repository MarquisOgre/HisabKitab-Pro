import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: 'sale' | 'purchase';
  party: string;
  amount: number;
  date: string;
  invoice: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="metric-card p-3 md:p-4">
      <h3 className="font-semibold text-base md:text-lg mb-3 md:mb-4">Recent Transactions</h3>
      {transactions.length === 0 ? (
        <div className="text-center py-6 md:py-8 text-muted-foreground">
          <p className="text-sm md:text-base">No transactions yet</p>
          <p className="text-xs md:text-sm">Create your first invoice to see transactions here</p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-4">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <div
                  className={cn(
                    "p-1.5 md:p-2 rounded-lg shrink-0",
                    txn.type === "sale"
                      ? "bg-success/10 text-success"
                      : "bg-warning/10 text-warning"
                  )}
                >
                  {txn.type === "sale" ? (
                    <ArrowUpCircle className="w-4 h-4 md:w-5 md:h-5" />
                  ) : (
                    <ArrowDownCircle className="w-4 h-4 md:w-5 md:h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-xs md:text-sm truncate">{txn.party}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {txn.invoice} • {txn.date}
                  </p>
                </div>
              </div>
              <p
                className={cn(
                  "font-semibold text-xs md:text-sm shrink-0 ml-2",
                  txn.type === "sale" ? "text-success" : "text-foreground"
                )}
              >
                {txn.type === "sale" ? "+" : "-"}
                {formatCurrency(txn.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
