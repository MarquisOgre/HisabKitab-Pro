// @ts-nocheck
import { useState, useEffect } from "react";
import { 
  CreditCard, 
  QrCode, 
  Building, 
  Loader2, 
  Save,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isSuperAdminEmail } from "@/lib/superadmin";
// @ts-nocheck
interface PaymentSettingsData {
  id?: string;
  razorpay_key_id: string;
  razorpay_key_secret: string;
  razorpay_enabled: boolean;
  upi_id: string;
  upi_name: string;
  bank_name: string;
  bank_account_number: string;
  bank_ifsc: string;
  bank_account_holder: string;
}

export function PaymentSettings() {
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  
  const [settings, setSettings] = useState<PaymentSettingsData>({
    razorpay_key_id: '',
    razorpay_key_secret: '',
    razorpay_enabled: false,
    upi_id: '',
    upi_name: '',
    bank_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    bank_account_holder: ''
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadSettings();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      // If no row exists yet, keep defaults and let the user save for the first time.
      if (!data) return;

      setSettings({
        id: data.id,
        razorpay_key_id: data.razorpay_key_id || '',
        razorpay_key_secret: data.razorpay_key_secret || '',
        razorpay_enabled: data.razorpay_enabled === 'true' || data.razorpay_enabled === true as any,
        upi_id: data.upi_id || '',
        upi_name: data.upi_name || '',
        bank_name: data.bank_name || '',
        bank_account_number: data.bank_account_number || '',
        bank_ifsc: data.bank_ifsc || '',
        bank_account_holder: data.bank_account_holder || ''
      });
    } catch (error: any) {
      console.error('Error loading payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  };

  const ensureRazorpayScriptLoaded = async (): Promise<void> => {
    const existing = document.querySelector('script[data-razorpay-checkout="true"]') as HTMLScriptElement | null;
    if (existing) return;

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.dataset.razorpayCheckout = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
      document.body.appendChild(script);
    });
  };

  const handleSave = async () => {
    if (!isSuperAdmin) {
      toast.error('Only SuperAdmin can modify payment settings');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          id: settings.id,
          razorpay_key_id: settings.razorpay_key_id,
          razorpay_key_secret: settings.razorpay_key_secret,
          razorpay_enabled: settings.razorpay_enabled,
          upi_id: settings.upi_id,
          upi_name: settings.upi_name,
          bank_name: settings.bank_name,
          bank_account_number: settings.bank_account_number,
          bank_ifsc: settings.bank_ifsc,
          bank_account_holder: settings.bank_account_holder,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Payment settings saved successfully');
    } catch (error: any) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="metric-card">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="w-5 h-5" />
          <p>Only SuperAdmin can access payment settings</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const testRazorpayPayment = async () => {
    if (!settings.razorpay_key_id) {
      toast.error("Please enter Razorpay Key ID first");
      return;
    }

    try {
      await ensureRazorpayScriptLoaded();
      const RazorpayCtor = (window as any).Razorpay;
      if (!RazorpayCtor) {
        throw new Error('Razorpay SDK not available after script load');
      }

      const options = {
        key: settings.razorpay_key_id,
        amount: 100, // ₹1 in paise for testing
        currency: 'INR',
        name: 'Test Payment',
        description: 'Testing Razorpay Integration',
        handler: function (response: any) {
          toast.success(`Payment Successful! ID: ${response?.razorpay_payment_id ?? 'N/A'}`);
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled');
          },
        },
      };

      const rzp = new RazorpayCtor(options);
      rzp.open();
    } catch (e: any) {
      console.error('Razorpay test payment failed:', e);
      toast.error(e?.message ? `Test payment failed: ${e.message}` : 'Test payment failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Razorpay Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <CardTitle>Razorpay Payment Gateway</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.razorpay_enabled ? "default" : "secondary"}>
                {settings.razorpay_enabled ? "Enabled" : "Disabled"}
              </Badge>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testRazorpayPayment}
                disabled={!settings.razorpay_key_id}
              >
                Test Payment
              </Button>
            </div>
          </div>
          <CardDescription>
            Configure Razorpay for accepting online payments. Using sandbox/test keys for development.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Razorpay</Label>
              <p className="text-sm text-muted-foreground">Accept online payments via Razorpay</p>
            </div>
            <Switch
              checked={settings.razorpay_enabled}
              onCheckedChange={(checked) => setSettings({ ...settings, razorpay_enabled: checked })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="razorpay_key_id">Key ID (Test)</Label>
              <Input
                id="razorpay_key_id"
                value={settings.razorpay_key_id}
                onChange={(e) => setSettings({ ...settings, razorpay_key_id: e.target.value })}
                placeholder="rzp_test_..."
              />
              <p className="text-xs text-muted-foreground">Using Razorpay sandbox key for testing</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="razorpay_key_secret">Key Secret</Label>
              <div className="relative">
                <Input
                  id="razorpay_key_secret"
                  type={showSecret ? "text" : "password"}
                  value={settings.razorpay_key_secret}
                  onChange={(e) => setSettings({ ...settings, razorpay_key_secret: e.target.value })}
                  placeholder="Enter key secret"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* UPI Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" />
            <CardTitle>UPI Payment Details</CardTitle>
          </div>
          <CardDescription>
            Configure UPI ID for receiving direct payments and displaying QR codes on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="upi_id">UPI ID</Label>
              <Input
                id="upi_id"
                value={settings.upi_id}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                placeholder="business@upi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upi_name">UPI Display Name</Label>
              <Input
                id="upi_name"
                value={settings.upi_name}
                onChange={(e) => setSettings({ ...settings, upi_name: e.target.value })}
                placeholder="Your Business Name"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            <CardTitle>Bank Account Details</CardTitle>
          </div>
          <CardDescription>
            Bank details to display on invoices for NEFT/RTGS/IMPS transfers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                placeholder="e.g., State Bank of India"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_holder">Account Holder Name</Label>
              <Input
                id="bank_account_holder"
                value={settings.bank_account_holder}
                onChange={(e) => setSettings({ ...settings, bank_account_holder: e.target.value })}
                placeholder="Account holder name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_account_number">Account Number</Label>
              <Input
                id="bank_account_number"
                value={settings.bank_account_number}
                onChange={(e) => setSettings({ ...settings, bank_account_number: e.target.value })}
                placeholder="Account number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank_ifsc">IFSC Code</Label>
              <Input
                id="bank_ifsc"
                value={settings.bank_ifsc}
                onChange={(e) => setSettings({ ...settings, bank_ifsc: e.target.value })}
                placeholder="e.g., SBIN0001234"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Payment Settings
        </Button>
      </div>
    </div>
  );
}
