import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Save, 
  Mail, 
  Shield, 
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

interface EmailSettingsData {
  id: string;
  provider: "resend" | "zoho";
  resend_api_key: string | null;
  zoho_smtp_host: string;
  zoho_smtp_port: number;
  zoho_email: string | null;
  zoho_password: string | null;
  from_email: string;
  from_name: string;
  superadmin_email: string;
  is_active: boolean;
}

export function EmailSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [showZohoPassword, setShowZohoPassword] = useState(false);
  
  const [settings, setSettings] = useState<EmailSettingsData>({
    id: "",
    provider: "resend",
    resend_api_key: "",
    zoho_smtp_host: "smtp.zoho.com",
    zoho_smtp_port: 587,
    zoho_email: "",
    zoho_password: "",
    from_email: "onboarding@resend.dev",
    from_name: "HisabKitab",
    superadmin_email: "marquisogre@gmail.com",
    is_active: true
  });

  // Note: onboarding@resend.dev is Resend's free testing sender
  // For production, verify your domain at resend.com/domains

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setSettings({
          id: data.id,
          provider: data.provider as "resend" | "zoho",
          resend_api_key: data.resend_api_key || "",
          zoho_smtp_host: data.zoho_smtp_host || "smtp.zoho.com",
          zoho_smtp_port: data.zoho_smtp_port || 587,
          zoho_email: data.zoho_email || "",
          zoho_password: data.zoho_password || "",
          from_email: data.from_email,
          from_name: data.from_name,
          superadmin_email: data.superadmin_email,
          is_active: data.is_active ?? true
        });
      }
    } catch (error: any) {
      toast.error("Failed to load email settings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        provider: settings.provider,
        resend_api_key: settings.resend_api_key || null,
        zoho_smtp_host: settings.zoho_smtp_host,
        zoho_smtp_port: settings.zoho_smtp_port,
        zoho_email: settings.zoho_email || null,
        zoho_password: settings.zoho_password || null,
        from_email: settings.from_email,
        from_name: settings.from_name,
        superadmin_email: settings.superadmin_email,
        is_active: settings.is_active
      };

      if (settings.id) {
        const { error } = await supabase
          .from("email_settings")
          .update(updateData)
          .eq("id", settings.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_settings")
          .insert(updateData);
        
        if (error) throw error;
      }

      toast.success("Email settings saved successfully!");
    } catch (error: any) {
      toast.error("Failed to save settings: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "test",
          to: settings.superadmin_email,
          name: "Admin"
        }
      });

      if (error) throw error;
      toast.success("Test email sent! Check your inbox.");
    } catch (error: any) {
      toast.error("Failed to send test email: " + error.message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Provider Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Provider
          </CardTitle>
          <CardDescription>
            Choose your email service provider for sending notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={settings.provider}
            onValueChange={(v) => setSettings({ ...settings, provider: v as "resend" | "zoho" })}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className={`relative flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${settings.provider === "resend" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
              <RadioGroupItem value="resend" id="resend" className="mt-1" />
              <Label htmlFor="resend" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Resend</span>
                  <Badge variant="secondary" className="text-xs">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Modern email API with excellent deliverability. Simple API key setup.
                </p>
              </Label>
            </div>
            
            <div className={`relative flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-colors ${settings.provider === "zoho" ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
              <RadioGroupItem value="zoho" id="zoho" className="mt-1" />
              <Label htmlFor="zoho" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Zoho Mail SMTP</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Use your Zoho Mail account for sending emails via SMTP.
                </p>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Provider-specific Configuration */}
      {settings.provider === "resend" ? (
        <Card>
          <CardHeader>
            <CardTitle>Resend Configuration</CardTitle>
            <CardDescription>
              Get your API key from{" "}
              <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                resend.com/api-keys
              </a>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resend_api_key">Resend API Key</Label>
              <div className="relative">
                <Input
                  id="resend_api_key"
                  type={showResendKey ? "text" : "password"}
                  value={settings.resend_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                  placeholder="re_xxxxxxxxxxxx"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowResendKey(!showResendKey)}
                >
                  {showResendKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Zoho SMTP Configuration</CardTitle>
            <CardDescription>
              Configure your Zoho Mail SMTP credentials
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zoho_smtp_host">SMTP Host</Label>
                <Input
                  id="zoho_smtp_host"
                  value={settings.zoho_smtp_host}
                  onChange={(e) => setSettings({ ...settings, zoho_smtp_host: e.target.value })}
                  placeholder="smtp.zoho.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zoho_smtp_port">SMTP Port</Label>
                <Input
                  id="zoho_smtp_port"
                  type="number"
                  value={settings.zoho_smtp_port}
                  onChange={(e) => setSettings({ ...settings, zoho_smtp_port: parseInt(e.target.value) || 587 })}
                  placeholder="587"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoho_email">Zoho Email</Label>
              <Input
                id="zoho_email"
                type="email"
                value={settings.zoho_email || ""}
                onChange={(e) => setSettings({ ...settings, zoho_email: e.target.value })}
                placeholder="your@zohomail.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zoho_password">Zoho App Password</Label>
              <div className="relative">
                <Input
                  id="zoho_password"
                  type={showZohoPassword ? "text" : "password"}
                  value={settings.zoho_password || ""}
                  onChange={(e) => setSettings({ ...settings, zoho_password: e.target.value })}
                  placeholder="App-specific password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowZohoPassword(!showZohoPassword)}
                >
                  {showZohoPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use an app-specific password from your Zoho account security settings
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            General Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                placeholder="HisabKitab"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                placeholder="noreply@HisabKitab.com"
              />
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="superadmin_email">SuperAdmin Notification Email</Label>
            <Input
              id="superadmin_email"
              type="email"
              value={settings.superadmin_email}
              onChange={(e) => setSettings({ ...settings, superadmin_email: e.target.value })}
              placeholder="admin@example.com"
            />
            <p className="text-xs text-muted-foreground">
              Receive notifications for new payments, trial requests, and contact messages
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates Info */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            The following email templates are automatically sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "Payment Submitted", desc: "Sent to admin when manual payment is submitted" },
              { name: "Payment Verified", desc: "Sent to user when payment is verified" },
              { name: "Payment Rejected", desc: "Sent to user when payment is rejected" },
              { name: "Trial Request", desc: "Sent to admin when new trial is requested" },
              { name: "Trial Approved", desc: "Sent to user when trial is approved" },
              { name: "Trial Rejected", desc: "Sent to user when trial is rejected" },
              { name: "Contact Form", desc: "Sent to admin when contact form is submitted" },
              { name: "Contact Auto-Reply", desc: "Sent to user after submitting contact form" },
              { name: "Welcome Email", desc: "Sent to new users after signup" },
              { name: "License Expiry", desc: "Reminder sent before license expires" }
            ].map((template) => (
              <div key={template.name} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
                  <p className="text-xs text-muted-foreground">{template.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
        <Button variant="outline" onClick={handleTestEmail} disabled={testing}>
          {testing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          Send Test Email
        </Button>
      </div>
    </div>
  );
}
