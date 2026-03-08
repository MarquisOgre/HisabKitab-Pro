import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Check,
  X,
  Eye,
  Search,
  CreditCard,
  QrCode,
  Trash2,
  ImageIcon
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
// @ts-nocheck
interface PlanPayment {
  id: string;
  user_id: string | null;
  user_email: string;
  user_name: string | null;
  plan_id: string | null;
  plan_name: string;
  amount: number;
  payment_method: string;
  razorpay_payment_id: string | null;
  manual_reference_id: string | null;
  screenshot_url: string | null;
  status: string;
  verified_at: string | null;
  notes: string | null;
  created_at: string;
}

interface LicensePlan {
  id: string;
  plan_name: string;
  duration_days: number;
}

export function PlanPaymentsManagement() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PlanPayment[]>([]);
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PlanPayment | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("license_plans")
      .select("id, plan_name, duration_days");
    if (data) setPlans(data);
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("plan_payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch payments: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const activateLicense = async (payment: PlanPayment) => {
    // Get plan details for duration
    const plan = plans.find(p => p.id === payment.plan_id);
    if (!plan) {
      console.error("Plan not found for payment:", payment.plan_id);
      return false;
    }

    const expiryDate = format(addDays(new Date(), plan.duration_days), "yyyy-MM-dd");

    // Determine limits based on plan name
    const planLimits = getPlanLimits(plan.plan_name);

    // Check if user already has a license
    const { data: existingLicense } = await supabase
      .from("license_settings")
      .select("id")
      .eq("user_email", payment.user_email)
      .maybeSingle();

    if (existingLicense) {
      // Update existing license
      const { error } = await supabase
        .from("license_settings")
        .update({
          expiry_date: expiryDate,
          license_type: plan.plan_name,
          max_users: planLimits.maxUsers,
          max_businesses: planLimits.maxBusinesses,
          max_simultaneous_logins: planLimits.maxLogins,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingLicense.id);
      
      if (error) {
        console.error("Failed to update license:", error);
        return false;
      }
    } else {
      // Create new license
      const { error } = await supabase
        .from("license_settings")
        .insert({
          user_id: payment.user_id,
          user_email: payment.user_email,
          expiry_date: expiryDate,
          license_type: plan.plan_name,
          licensed_to: payment.user_email,
          support_email: "support@hisabkitab.com",
          support_phone: "+91-77029-60600",
          support_whatsapp: "+91-77029-60600",
          max_users: planLimits.maxUsers,
          max_businesses: planLimits.maxBusinesses,
          max_simultaneous_logins: planLimits.maxLogins
        });
      
      if (error) {
        console.error("Failed to create license:", error);
        return false;
      }
    }

    // Ensure user has Admin role
    if (payment.user_id) {
      await ensureAdminRole(payment.user_id);
    }

    return true;
  };

  const getPlanLimits = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "silver":
        return { maxUsers: 3, maxBusinesses: 2, maxLogins: 2 };
      case "gold":
        return { maxUsers: 5, maxBusinesses: 3, maxLogins: 3 };
      case "platinum":
        return { maxUsers: 10, maxBusinesses: 5, maxLogins: 5 };
      case "diamond":
        return { maxUsers: 20, maxBusinesses: 10, maxLogins: 10 };
      default:
        return { maxUsers: 5, maxBusinesses: 3, maxLogins: 3 };
    }
  };

  const ensureAdminRole = async (userId: string) => {
    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (existingRole) {
        // Update to admin if not already admin
        if (existingRole.role !== "admin") {
          await supabase
            .from("user_roles")
            .update({ role: "admin" })
            .eq("id", existingRole.id);
        }
      } else {
        // Create admin role
        await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
      }
    } catch (error) {
      console.error("Failed to ensure admin role:", error);
    }
  };

  const sendNotificationEmail = async (payment: PlanPayment, status: "verified" | "failed", notes: string) => {
    try {
      const { error } = await supabase.functions.invoke("payment-notification", {
        body: {
          userEmail: payment.user_email,
          userName: payment.user_name || payment.user_email,
          planName: payment.plan_name,
          amount: payment.amount,
          status,
          notes: status === "failed" ? notes : undefined
        }
      });

      if (error) {
        console.error("Failed to send notification email:", error);
      }
    } catch (err) {
      console.error("Email notification error:", err);
    }
  };

  const handleVerification = async (status: "verified" | "failed") => {
    if (!selectedPayment || !user) return;

    setProcessing(true);
    try {
      // If verifying, activate the license first
      if (status === "verified") {
        const licenseActivated = await activateLicense(selectedPayment);
        if (!licenseActivated) {
          toast.error("Failed to activate license. Please try again.");
          setProcessing(false);
          return;
        }
      }

      // Update payment status
      const { error } = await supabase
        .from("plan_payments")
        .update({
          status,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          notes: verificationNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", selectedPayment.id);

      if (error) throw error;

      // Send email notification
      await sendNotificationEmail(selectedPayment, status, verificationNotes);

      setPayments(payments.map(p =>
        p.id === selectedPayment.id
          ? { ...p, status, verified_at: new Date().toISOString(), notes: verificationNotes }
          : p
      ));

      toast.success(
        status === "verified" 
          ? "Payment verified and license activated!" 
          : "Payment rejected and user notified"
      );
      setSelectedPayment(null);
      setVerificationNotes("");
    } catch (error: any) {
      toast.error("Failed to update payment: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("plan_payments")
        .delete()
        .eq("id", paymentId);

      if (error) throw error;

      setPayments(payments.filter(p => p.id !== paymentId));
      toast.success("Payment record deleted");
      setDeleteConfirmId(null);
    } catch (error: any) {
      toast.error("Failed to delete payment: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "verified":
        return <Badge className="bg-success/10 text-success">Verified</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive">Failed</Badge>;
      case "pending":
        return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    return method === "razorpay" ? (
      <CreditCard className="w-4 h-4 text-primary" />
    ) : (
      <QrCode className="w-4 h-4 text-primary" />
    );
  };

  const filteredPayments = payments.filter(p =>
    p.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.manual_reference_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = payments.filter(p => p.status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {pendingCount > 0 && (
          <Badge variant="destructive">{pendingCount} Pending</Badge>
        )}
      </div>

      {filteredPayments.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No payments found</p>
      ) : (
        <div className="overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="text-sm text-muted-foreground">
                    {payment.created_at ? format(new Date(payment.created_at), "dd MMM yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{payment.user_name || "-"}</p>
                      <p className="text-xs text-muted-foreground">{payment.user_email}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{payment.plan_name}</TableCell>
                  <TableCell>₹{payment.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.payment_method)}
                      <span className="text-sm capitalize">
                        {payment.payment_method === "qr_manual" ? "UPI/QR" : "Razorpay"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate text-sm">
                    {payment.razorpay_payment_id || payment.manual_reference_id || "-"}
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {payment.status === "pending" && payment.payment_method === "qr_manual" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Verify
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(payment.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Verification Dialog */}
      <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment & Activate License</DialogTitle>
            <DialogDescription>
              Verify the payment to activate user as Admin and assign the corresponding license.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{selectedPayment.user_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPayment.user_email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p className="font-medium">{selectedPayment.plan_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">₹{selectedPayment.amount.toLocaleString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reference ID</p>
                  <p className="font-medium font-mono text-xs break-all">
                    {selectedPayment.manual_reference_id || "-"}
                  </p>
                </div>
              </div>

              {/* Screenshot Preview */}
              {selectedPayment.screenshot_url && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ImageIcon className="w-4 h-4" /> Payment Screenshot
                  </p>
                  <a href={selectedPayment.screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={selectedPayment.screenshot_url}
                      alt="Payment screenshot"
                      className="w-full max-h-64 object-contain rounded-lg border bg-white cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </a>
                </div>
              )}

              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                <p className="font-medium text-primary mb-1">Upon Verification:</p>
                <ul className="text-muted-foreground space-y-1 text-xs">
                  <li>• User will be assigned <strong>Admin</strong> role</li>
                  <li>• License will be activated with <strong>{selectedPayment.plan_name}</strong> plan</li>
                  <li>• Email notification will be sent to user</li>
                </ul>
              </div>

              <div>
                <label className="text-sm text-muted-foreground">Verification Notes (optional)</label>
                <Textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedPayment?.status === "pending" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleVerification("failed")}
                  disabled={processing}
                  className="text-destructive"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleVerification("verified")}
                  disabled={processing}
                  className="bg-success hover:bg-success/90"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  Activate User & License
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeletePayment(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
