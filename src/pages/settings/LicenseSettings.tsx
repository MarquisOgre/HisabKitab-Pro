import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Shield, Phone, Mail, MessageCircle, Save, AlertTriangle, Users, UserCheck, CreditCard, Building2 } from "lucide-react";
import { useLicenseSettings } from "@/hooks/useLicenseSettings";
import { useBusinessSettings } from "@/contexts/BusinessContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";
import { UserLicenseManagement } from "@/components/settings/UserLicenseManagement";
import { isSuperAdminEmail } from "@/lib/superadmin";

interface LicensePlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
}

export function LicenseSettings() {
  const { licenseSettings, isLoading, updateLicenseSettings, getDaysRemaining, formatExpiryDate, isLicenseValid } = useLicenseSettings();
  const { businessSettings } = useBusinessSettings();
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [formData, setFormData] = useState({
    expiry_date: "",
    license_type: "",
    licensed_to: "",
    support_email: "",
    support_phone: "",
    support_whatsapp: "",
    max_users: 5,
    max_businesses: 1,
    max_simultaneous_logins: 3,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Keep dropdown selection in sync with saved license type
  useEffect(() => {
    if (!plans.length || !licenseSettings?.license_type) return;
    const matched = plans.find((p) => p.plan_name === licenseSettings.license_type);
    setSelectedPlanId(matched?.id ?? "");
  }, [plans, licenseSettings?.license_type]);

  useEffect(() => {
    if (licenseSettings) {
      setFormData({
        expiry_date: licenseSettings.expiry_date || "",
        license_type: licenseSettings.license_type || "",
        licensed_to: licenseSettings.licensed_to || user?.email || "",
        support_email: licenseSettings.support_email || "",
        support_phone: licenseSettings.support_phone || "",
        support_whatsapp: licenseSettings.support_whatsapp || "",
        max_users: (licenseSettings as any).max_users || 5,
        max_businesses: (licenseSettings as any).max_businesses || 1,
        max_simultaneous_logins: (licenseSettings as any).max_simultaneous_logins || 3,
      });
    }
  }, [licenseSettings, user?.email]);

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("license_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    if (data) setPlans(data);
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlanId(planId);

    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const newExpiryDate = addDays(new Date(), plan.duration_days);
    const updates = {
      expiry_date: format(newExpiryDate, "yyyy-MM-dd"),
      license_type: plan.plan_name,
      licensed_to: user?.email || formData.licensed_to,
    };

    // Update UI immediately
    setFormData((prev) => ({ ...prev, ...updates }));

    // Persist immediately so footer + status update without extra steps
    updateLicenseSettings.mutate(updates);
  };

  const handleSave = () => {
    updateLicenseSettings.mutate({
      ...formData,
      // ensure license is issued to email
      licensed_to: user?.email || formData.licensed_to,
    });
  };

  const daysRemaining = getDaysRemaining();
  const valid = isLicenseValid();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          License Management
        </CardTitle>
        <CardDescription>
          Manage application license and validity settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* License Status - Visible to all users */}
        <div className={`p-4 rounded-lg border ${valid ? (daysRemaining <= 30 ? 'bg-warning/10 border-warning/30' : 'bg-success/10 border-success/30') : 'bg-destructive/10 border-destructive/30'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!valid ? (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              ) : daysRemaining <= 30 ? (
                <AlertTriangle className="w-8 h-8 text-warning" />
              ) : (
                <Shield className="w-8 h-8 text-success" />
              )}
              <div>
                <p className="font-semibold">
                  {!valid ? 'License Expired' : daysRemaining <= 30 ? 'License Expiring Soon' : 'License Active'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {valid ? `${daysRemaining} days remaining • Expires ${formatExpiryDate()}` : `Expired on ${formatExpiryDate()}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{valid ? daysRemaining : 0}</p>
              <p className="text-xs text-muted-foreground">Days Left</p>
            </div>
          </div>
        </div>

        {/* License info is view-only - managed via payments */}
      </CardContent>
    </Card>

    {/* SuperAdmin User License Management */}
    {isSuperAdmin && (
      <div className="mt-6">
        <UserLicenseManagement />
      </div>
    )}
    </>
  );
}
