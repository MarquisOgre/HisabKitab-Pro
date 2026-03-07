import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Phone, Mail, MapPin, Building, CreditCard, Loader2, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Party {
  id: string;
  name: string;
  party_type: string | null;
  phone: string | null;
  email: string | null;
  opening_balance: number | null;
  billing_address: string | null;
  shipping_address: string | null;
  gstin: string | null;
  credit_limit: number | null;
  created_at: string;
}

interface Payment {
  id: string;
  payment_number: string;
  payment_date: string;
  amount: number;
  payment_mode: string | null;
  payment_type: string;
  notes: string | null;
}

export default function ViewParty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [party, setParty] = useState<Party | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchParty();
      fetchPayments();
    }
  }, [user, id]);

  const fetchParty = async () => {
    try {
      const { data, error } = await supabase
        .from("parties")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setParty(data);
    } catch (error: any) {
      toast.error("Failed to fetch party: " + error.message);
      navigate("/parties");
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("id, payment_number, payment_date, amount, payment_mode, payment_type, notes")
        .eq("party_id", id)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      console.error("Failed to fetch payments:", error);
    }
  };

  const getModeColor = (mode: string | null) => {
    const colors: Record<string, string> = {
      cash: "bg-success/10 text-success",
      bank: "bg-primary/10 text-primary",
      upi: "bg-secondary/50 text-secondary-foreground",
      cheque: "bg-warning/10 text-warning",
    };
    return colors[mode || "cash"] || "bg-muted text-muted-foreground";
  };

  const totalReceived = payments.filter(p => p.payment_type === "in").reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments.filter(p => p.payment_type === "out").reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!party) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Party not found</p>
        <Button asChild className="mt-4">
          <Link to="/parties">Back to Parties</Link>
        </Button>
      </div>
    );
  }

  const balance = party.opening_balance || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/parties">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold",
                party.party_type === "customer"
                  ? "bg-primary/10 text-primary"
                  : "bg-accent/10 text-accent"
              )}
            >
              {party.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{party.name}</h1>
              <span
                className={cn(
                  "text-sm px-3 py-1 rounded-full capitalize",
                  party.party_type === "customer"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                )}
              >
                {party.party_type || "customer"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/parties/${id}/transactions`}>View Transactions</Link>
          </Button>
          <Button className="btn-gradient gap-2" asChild>
            <Link to={`/parties/edit/${id}`}>
              <Edit className="w-4 h-4" />
              Edit Party
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-muted-foreground" />
              <span>{party.phone || "Not provided"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <span>{party.email || "Not provided"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Tax Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tax Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">GSTIN</p>
                <p className="font-medium">{party.gstin || "Not provided"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Balance & Credit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className={cn(
                  "text-xl font-bold",
                  balance > 0 ? "text-success" : balance < 0 ? "text-warning" : ""
                )}>
                  ₹{Math.abs(balance).toLocaleString()}
                  {balance > 0 && " (Receivable)"}
                  {balance < 0 && " (Payable)"}
                </p>
              </div>
            </div>
            {party.credit_limit && (
              <div>
                <p className="text-sm text-muted-foreground">Credit Limit</p>
                <p className="font-medium">₹{party.credit_limit.toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Addresses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {party.billing_address || "No billing address provided"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {party.shipping_address || "No shipping address provided"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Payment History
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-success font-medium">Received: ₹{totalReceived.toLocaleString()}</span>
            <span className="text-warning font-medium">Paid: ₹{totalPaid.toLocaleString()}</span>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No payment history found</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      payment.payment_type === "in" ? "bg-success/10" : "bg-warning/10"
                    )}>
                      {payment.payment_type === "in" ? (
                        <ArrowDownRight className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{payment.payment_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(payment.payment_date), "dd MMM yyyy")}
                        {payment.notes && ` • ${payment.notes.substring(0, 30)}${payment.notes.length > 30 ? '...' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-1 text-xs font-medium rounded-full capitalize",
                      getModeColor(payment.payment_mode)
                    )}>
                      {payment.payment_mode || "Cash"}
                    </span>
                    <span className={cn(
                      "font-bold",
                      payment.payment_type === "in" ? "text-success" : "text-warning"
                    )}>
                      {payment.payment_type === "in" ? "+" : "-"}₹{payment.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}