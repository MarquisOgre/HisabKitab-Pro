// @ts-nocheck
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  CreditCard,
  QrCode,
  ArrowLeft,
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  User
} from "lucide-react";
import { z } from "zod";
// @ts-nocheck
interface LicensePlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  description: string | null;
}
// @ts-nocheck
interface PaymentSettings {
  razorpay_key_id: string | null;
  razorpay_enabled: boolean;
  upi_id: string | null;
  upi_name: string | null;
}

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  
  const planId = searchParams.get("plan");
  
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<LicensePlan | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "qr_manual">("razorpay");
  const [processing, setProcessing] = useState(false);
  
  // Auth form states
  const [isSignUp, setIsSignUp] = useState(true);
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // Manual payment states
  const [manualReferenceId, setManualReferenceId] = useState("");
  const [showManualPaymentForm, setShowManualPaymentForm] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchPlanAndSettings();
  }, [planId]);

  const fetchPlanAndSettings = async () => {
    setLoading(true);
    try {
      // Fetch plan details
      if (planId) {
        const { data: planData, error: planError } = await supabase
          .from("license_plans")
          .select("*")
          .eq("id", planId)
          .single();
        
        if (planError) throw planError;
        setPlan(planData);
      }
      
      // Fetch payment settings (public read)
      const { data: settingsData } = await supabase
        .from("payment_settings")
        .select("razorpay_key_id, razorpay_enabled, upi_id, upi_name")
        .maybeSingle();
      
      if (settingsData) {
        setPaymentSettings(settingsData);
        // Default to QR if Razorpay is not enabled
        if (!settingsData.razorpay_enabled) {
          setPaymentMethod("qr_manual");
        }
      }
    } catch (error: any) {
      toast.error("Failed to load plan details");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      emailSchema.parse(authForm.email);
      passwordSchema.parse(authForm.password);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || "Validation error");
      return;
    }
    
    setProcessing(true);
    try {
      if (isSignUp) {
        // Use edge function for auto-verified signup
        const { data: fnData, error: fnError } = await supabase.functions.invoke("checkout-signup", {
          body: {
            email: authForm.email,
            password: authForm.password,
            fullName: authForm.fullName,
          },
        });
        if (fnError) throw fnError;
        if (fnData?.error) throw new Error(fnData.error);
        
        // Now sign in the newly created (auto-verified) user
        const { error: signInErr } = await signIn(authForm.email, authForm.password);
        if (signInErr) throw signInErr;
        toast.success("Account created! You can now proceed with payment.");
      } else {
        const { error } = await signIn(authForm.email, authForm.password);
        if (error) throw error;
        toast.success("Signed in successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setProcessing(false);
    }
  };

  const ensureRazorpayScriptLoaded = async (): Promise<void> => {
    const existing = document.querySelector('script[data-razorpay-checkout="true"]');
    if (existing) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay'));
      document.body.appendChild(script);
    });
  };

  const handleRazorpayPayment = async () => {
    if (!user || !plan || !paymentSettings?.razorpay_key_id) {
      toast.error("Payment configuration not available");
      return;
    }
    
    setProcessing(true);
    try {
      await ensureRazorpayScriptLoaded();
      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) throw new Error("Razorpay SDK not loaded");
      
      const options = {
        key: paymentSettings.razorpay_key_id,
        amount: plan.price * 100, // Convert to paise
        currency: "INR",
        name: "HisabKitab-Pro",
        description: `${plan.plan_name} - ${plan.duration_days} Days`,
        handler: async function (response: any) {
          // Record the payment
          const { error } = await supabase.from("plan_payments").insert({
            user_id: user.id,
            user_email: user.email || "",
            user_name: authForm.fullName || user.email,
            plan_id: plan.id,
            plan_name: plan.plan_name,
            amount: plan.price,
            payment_method: "razorpay",
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || null,
            status: "completed"
          });
          
          if (error) {
            console.error("Failed to record payment:", error);
            toast.error("Payment recorded but failed to save. Contact support.");
          } else {
            toast.success("Payment successful! Your license will be activated shortly.");
            navigate("/payment-pending");
          }
        },
        prefill: {
          name: authForm.fullName || "",
          email: user.email || ""
        },
        modal: {
          ondismiss: function() {
            toast.info("Payment cancelled");
            setProcessing(false);
          }
        }
      };
      
      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
      setProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    if (!user || !plan) {
      toast.error("Please sign in first");
      return;
    }
    
    if (!manualReferenceId.trim()) {
      toast.error("Please enter the payment reference ID");
      return;
    }
    
    setProcessing(true);
    try {
      const { error } = await supabase.from("plan_payments").insert({
        user_id: user.id,
        user_email: user.email || "",
        user_name: authForm.fullName || user.email,
        plan_id: plan.id,
        plan_name: plan.plan_name,
        amount: plan.price,
        payment_method: "qr_manual",
        manual_reference_id: manualReferenceId.trim(),
        status: "pending"
      });
      
      if (error) throw error;

      // Send notification to SuperAdmin about new payment
      try {
        await supabase.functions.invoke("notify-admin", {
          body: {
            type: "payment_submitted",
            data: {
              name: authForm.fullName || user.email,
              email: user.email,
              planName: plan.plan_name,
              amount: plan.price,
              referenceId: manualReferenceId.trim()
            }
          }
        });
      } catch (notifyError) {
        console.error("Failed to notify admin:", notifyError);
      }
      
      toast.success("Payment submitted for verification. You'll receive confirmation once verified.");
      navigate("/payment-pending");
    } catch (error: any) {
      toast.error("Failed to submit payment: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDuration = (days: number) => {
    if (days <= 30) return `${days} Days`;
    const months = Math.round(days / 30);
    if (days < 365) return `${months} Month${months > 1 ? 's' : ''}`;
    const years = Math.round(days / 365);
    return `${years} Year${years > 1 ? 's' : ''}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <p className="text-muted-foreground">No plan selected</p>
        <Button asChild>
          <Link to="/#pricing">View Plans</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 py-8 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
          <p className="text-muted-foreground">Complete your purchase to activate your license</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Auth Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {user ? "Account" : isSignUp ? "Create Account" : "Sign In"}
              </CardTitle>
              <CardDescription>
                {user 
                  ? "You're signed in and ready to pay"
                  : isSignUp 
                    ? "Create an account to complete your purchase" 
                    : "Sign in to your existing account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-sm">Signed in as</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Proceed to payment to complete your purchase.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAuth} className="space-y-4">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={authForm.fullName}
                        onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={authForm.email}
                      onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={authForm.password}
                        onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                        placeholder="••••••••"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={processing}>
                    {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isSignUp ? "Create Account" : "Sign In"}
                  </Button>
                  
                  <p className="text-center text-sm text-muted-foreground">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setIsSignUp(!isSignUp)}
                    >
                      {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Middle Column - Payment Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
              <CardDescription>Choose your preferred payment method</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "razorpay" | "qr_manual")}
                className="space-y-3"
              >
                {paymentSettings?.razorpay_enabled && (
                  <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="razorpay" id="razorpay" />
                    <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">Razorpay</span>
                        <Badge variant="secondary" className="text-xs">Instant</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Card, UPI, Net Banking
                      </p>
                    </Label>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 border rounded-lg p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="qr_manual" id="qr_manual" />
                  <Label htmlFor="qr_manual" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">UPI / QR Code</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scan & enter reference ID
                    </p>
                  </Label>
                </div>
              </RadioGroup>

              {/* QR Code Payment Section */}
              {paymentMethod === "qr_manual" && (
                <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                  <div className="text-center">
                    <div className="w-40 h-40 mx-auto bg-white rounded-lg border flex items-center justify-center">
                      {paymentSettings?.upi_id ? (
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=${paymentSettings.upi_id}&pn=${encodeURIComponent(paymentSettings.upi_name || 'HisabKitab-Pro')}&am=${plan.price}&cu=INR`}
                          alt="UPI QR Code"
                          className="w-36 h-36"
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground">QR not available</p>
                      )}
                    </div>
                    {paymentSettings?.upi_id && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium">UPI: {paymentSettings.upi_id}</p>
                        <p className="text-xs text-muted-foreground">₹{plan.price.toLocaleString("en-IN")}</p>
                      </div>
                    )}
                  </div>
                  
                  {showManualPaymentForm ? (
                    <div className="space-y-3 pt-3 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="referenceId" className="text-sm">Reference ID / UTR</Label>
                        <Input
                          id="referenceId"
                          value={manualReferenceId}
                          onChange={(e) => setManualReferenceId(e.target.value)}
                          placeholder="Enter transaction reference"
                          className="text-sm"
                        />
                      </div>
                      
                      <Button
                        onClick={handleManualPayment}
                        disabled={processing || !user}
                        className="w-full"
                        size="sm"
                      >
                        {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {!user ? "Sign in first" : "Submit for Verification"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowManualPaymentForm(true)}
                      className="w-full"
                      size="sm"
                    >
                      I've made the payment
                    </Button>
                  )}
                </div>
              )}

              {/* Razorpay Payment Button */}
              {paymentMethod === "razorpay" && (
                <Button
                  onClick={handleRazorpayPayment}
                  disabled={processing || !user}
                  className="w-full"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  {!user ? "Sign in to Pay" : `Pay ₹${plan.price.toLocaleString("en-IN")}`}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Order Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h3 className="font-semibold text-lg">{plan.plan_name}</h3>
                <p className="text-sm text-muted-foreground">{formatDuration(plan.duration_days)} access</p>
                {plan.description && (
                  <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{plan.price.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>₹0</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">₹{plan.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t">
                <Shield className="w-4 h-4" />
                <span>Secure checkout with 256-bit encryption</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
