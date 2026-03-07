import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, Home, LogOut, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function PaymentPending() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "completed" | "none">("pending");
  const [lastPayment, setLastPayment] = useState<any>(null);

  const checkPaymentStatus = async () => {
    if (!user) return;

    setChecking(true);
    try {
      // Check for any pending or completed payments
      const { data: payments, error } = await supabase
        .from("plan_payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (payments && payments.length > 0) {
        const latest = payments[0];
        setLastPayment(latest);

        if (latest.status === "completed" || latest.status === "verified") {
          setPaymentStatus("completed");
          // Payment verified, redirect to onboarding
          toast.success("Payment verified! Redirecting...");
          setTimeout(() => navigate("/onboarding/business"), 1500);
        } else if (latest.status === "pending") {
          setPaymentStatus("pending");
        } else {
          setPaymentStatus("none");
        }
      } else {
        setPaymentStatus("none");
      }
    } catch (error) {
      console.error("Error checking payment:", error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkPaymentStatus();
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleRefresh = () => {
    checkPaymentStatus();
  };

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-4">
        <p className="text-muted-foreground">Please sign in to view payment status</p>
        <Button asChild>
          <Link to="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            {paymentStatus === "completed" ? (
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-10 h-10 text-warning animate-pulse" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {paymentStatus === "completed" 
              ? "Payment Verified!" 
              : paymentStatus === "pending"
                ? "Verification in Progress"
                : "No Payment Found"}
          </CardTitle>
          <CardDescription className="text-base">
            {paymentStatus === "completed" 
              ? "Your payment has been verified. Redirecting to setup..."
              : paymentStatus === "pending"
                ? "Your payment is being verified by our team. This usually takes a few minutes."
                : "We couldn't find any recent payment. Please complete checkout first."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentStatus === "pending" && lastPayment && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{lastPayment.plan_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">₹{lastPayment.amount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-medium font-mono text-xs">
                  {lastPayment.manual_reference_id || lastPayment.razorpay_payment_id || "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium text-warning">Pending Verification</span>
              </div>
            </div>
          )}

          {paymentStatus === "pending" && (
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4" />
              Check Status
            </Button>
          )}

          {paymentStatus === "none" && (
            <Button asChild className="w-full">
              <Link to="/#pricing">View Plans</Link>
            </Button>
          )}

          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1 gap-2" asChild>
              <Link to="/">
                <Home className="w-4 h-4" />
                Home
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="flex-1 gap-2 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>

          {paymentStatus === "pending" && (
            <p className="text-center text-xs text-muted-foreground">
              You'll receive an email notification once your payment is verified.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
