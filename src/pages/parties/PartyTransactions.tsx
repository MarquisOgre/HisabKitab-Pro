import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, FileText, CreditCard, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  type: "sale" | "purchase" | "payment_in" | "payment_out";
  date: string;
  number: string;
  amount: number;
  status?: string;
}

export default function PartyTransactions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [partyName, setPartyName] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);

  useEffect(() => {
    if (user && id) {
      fetchTransactions();
    }
  }, [user, id]);

  const fetchTransactions = async () => {
    try {
      // Fetch party info
      const { data: party, error: partyError } = await supabase
        .from("parties")
        .select("name, party_type")
        .eq("id", id)
        .single();

      if (partyError) throw partyError;
      setPartyName(party.name);

      const allTransactions: Transaction[] = [];
      let receivable = 0;
      let payable = 0;

      // Fetch sale invoices
      const { data: sales } = await supabase
        .from("sale_invoices")
        .select("id, invoice_date, invoice_number, total_amount, balance_due, status")
        .eq("party_id", id)
        .eq("is_deleted", false)
        .order("invoice_date", { ascending: false });

      sales?.forEach(sale => {
        allTransactions.push({
          id: sale.id,
          type: "sale",
          date: sale.invoice_date,
          number: sale.invoice_number,
          amount: sale.total_amount || 0,
          status: sale.status,
        });
        receivable += sale.balance_due || 0;
      });

      // Fetch purchase invoices
      const { data: purchases } = await supabase
        .from("purchase_invoices")
        .select("id, invoice_date, invoice_number, total_amount, balance_due, status")
        .eq("party_id", id)
        .eq("is_deleted", false)
        .order("invoice_date", { ascending: false });

      purchases?.forEach(purchase => {
        allTransactions.push({
          id: purchase.id,
          type: "purchase",
          date: purchase.invoice_date,
          number: purchase.invoice_number,
          amount: purchase.total_amount || 0,
          status: purchase.status,
        });
        payable += purchase.balance_due || 0;
      });

      // Fetch payments
      const { data: payments } = await supabase
        .from("payments")
        .select("id, payment_date, payment_number, amount, payment_type")
        .eq("party_id", id)
        .order("payment_date", { ascending: false });

      payments?.forEach(payment => {
        allTransactions.push({
          id: payment.id,
          type: payment.payment_type === "in" ? "payment_in" : "payment_out",
          date: payment.payment_date,
          number: payment.payment_number,
          amount: payment.amount || 0,
        });
      });

      // Sort by date
      allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactions(allTransactions);
      setTotalReceivable(receivable);
      setTotalPayable(payable);
    } catch (error: any) {
      toast.error("Failed to fetch transactions: " + error.message);
      navigate("/parties");
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "sale": return "Sale Invoice";
      case "purchase": return "Purchase Bill";
      case "payment_in": return "Payment In";
      case "payment_out": return "Payment Out";
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sale": return "bg-success/10 text-success";
      case "purchase": return "bg-warning/10 text-warning";
      case "payment_in": return "bg-primary/10 text-primary";
      case "payment_out": return "bg-accent/10 text-accent";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleRowClick = (tx: Transaction) => {
    switch (tx.type) {
      case "sale":
        navigate(`/sale/invoices/${tx.id}`);
        break;
      case "purchase":
        navigate(`/purchase/bills/${tx.id}`);
        break;
      case "payment_in":
        navigate(`/sale/payments/${tx.id}`);
        break;
      case "payment_out":
        navigate(`/purchase/payments/${tx.id}`);
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/parties">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{partyName}</h1>
          <p className="text-muted-foreground">Transaction History</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Total Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Total Receivable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">₹{totalReceivable.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-warning" />
              Total Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">₹{totalPayable.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transactions found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow 
                    key={`${tx.type}-${tx.id}`} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleRowClick(tx)}
                  >
                    <TableCell>{format(new Date(tx.date), "dd MMM yyyy")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn("font-normal", getTypeColor(tx.type))}>
                        {getTypeLabel(tx.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{tx.number}</TableCell>
                    <TableCell>
                      {tx.status && (
                        <Badge variant={tx.status === "paid" ? "default" : "outline"}>
                          {tx.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ₹{tx.amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}