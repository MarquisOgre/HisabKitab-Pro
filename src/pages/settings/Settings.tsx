// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  User, 
  Shield, 
  Database, 
  Loader2,
  UserPlus,
  Trash2,
  Plus,
  Ruler,
  Building2,
  Crown,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { LicenseSettings } from "./LicenseSettings";
import { TwoFactorAuth } from "./TwoFactorAuth";
import { LicensePlans } from "@/components/settings/LicensePlans";
import { UserManagement } from "@/components/settings/UserManagement";
import { SuperAdminSettings } from "@/components/settings/SuperAdminSettings";
import { BusinessSettingsSection } from "@/components/settings/BusinessSettingsSection";
import { PaymentSettings } from "@/components/settings/PaymentSettings";
import { Eye, EyeOff } from "lucide-react";
import { isSuperAdminEmail } from "@/lib/superadmin";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UnitOfMeasure {
  id: string;
  name: string;
  symbol: string | null;
  is_default: boolean;
}

export default function Settings() {
  const { user, role, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const defaultTab = searchParams.get('tab') || 'business';
  const [loading, setLoading] = useState(true);

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Units of measure
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitSymbol, setNewUnitSymbol] = useState("");
  const [addingUnit, setAddingUnit] = useState(false);

  // Session settings (stored in localStorage)
  const [autoLogoutTime, setAutoLogoutTime] = useState("30");

  useEffect(() => {
    loadSettings();
    loadDisplayPreferences();
    fetchUnits();
  }, [user]);

  const loadSettings = async () => {
    setLoading(false);
  };

  const loadDisplayPreferences = () => {
    const savedAutoLogout = localStorage.getItem('autoLogoutTime');
    if (savedAutoLogout) setAutoLogoutTime(savedAutoLogout);
  };

  const fetchUnits = async () => {
    if (!user) return;
    setLoadingUnits(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name');

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      console.error('Error fetching units:', error);
    } finally {
      setLoadingUnits(false);
    }
  };

  const handleAddUnit = async () => {
    if (!newUnitName.trim() || !user) {
      toast.error('Please enter a unit name');
      return;
    }

    if (!isSuperAdmin) {
      toast.error('Only SuperAdmin can add units');
      return;
    }

    setAddingUnit(true);
    try {
      const { data, error } = await supabase
        .from('units')
        .insert({
          user_id: user.id,
          name: newUnitName.trim(),
          symbol: newUnitSymbol.trim() || null,
          is_default: false
        })
        .select()
        .single();

      if (error) throw error;

      setUnits([...units, data]);
      setNewUnitName("");
      setNewUnitSymbol("");
      toast.success('Unit added successfully');
    } catch (error: any) {
      console.error('Error adding unit:', error);
      toast.error('Failed to add unit');
    } finally {
      setAddingUnit(false);
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!isSuperAdmin) {
      toast.error('Only SuperAdmin can delete units');
      return;
    }

    try {
      const { error } = await supabase
        .from('units')
        .delete()
        .eq('id', unitId);

      if (error) throw error;

      setUnits(units.filter(u => u.id !== unitId));
      toast.success('Unit deleted');
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      toast.error('Failed to delete unit');
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAutoLogoutChange = (value: string) => {
    setAutoLogoutTime(value);
    localStorage.setItem('autoLogoutTime', value);
    toast.success(`Auto logout set to ${value === 'never' ? 'never' : value + ' minutes'}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account and business preferences</p>
      </div>

      {isSuperAdmin ? (
        <div className="space-y-6">
          {defaultTab === 'business' && <BusinessSettingsSection />}
          {defaultTab === 'users' && <UserManagement />}
          {defaultTab === 'security' && (
            <>
              <div className="metric-card">
                <h3 className="font-semibold mb-4">Change Password</h3>
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-sm text-destructive">Password must be at least 8 characters</p>
                  )}
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-sm text-destructive">Passwords do not match</p>
                  )}
                  <Button 
                    variant="outline" 
                    onClick={handlePasswordChange}
                    disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                  >
                    {changingPassword ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Update Password
                  </Button>
                </div>
              </div>
              <TwoFactorAuth />
              <div className="metric-card">
                <h3 className="font-semibold mb-4">Session Management</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto Logout</p>
                      <p className="text-sm text-muted-foreground">Automatically logout after inactivity</p>
                    </div>
                    <Select value={autoLogoutTime} onValueChange={handleAutoLogoutChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
          {defaultTab === 'license' && (
            <>
              <LicenseSettings />
              <LicensePlans />
            </>
          )}
          {defaultTab === 'payments' && <PaymentSettings />}
          {defaultTab === 'superadmin' && <SuperAdminSettings />}
        </div>
      ) : (
        <Tabs defaultValue={defaultTab} key={defaultTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full h-auto gap-2 bg-transparent p-0">
            <TabsTrigger value="business" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">Business Settings</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <User className="w-4 h-4" />
              <span className="hidden md:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="license" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden md:inline">License</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="space-y-6">
            <BusinessSettingsSection />
          </TabsContent>
          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>
          <TabsContent value="security" className="space-y-6">
            <div className="metric-card">
              <h3 className="font-semibold mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {newPassword && newPassword.length < 8 && (
                  <p className="text-sm text-destructive">Password must be at least 8 characters</p>
                )}
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
                <Button 
                  variant="outline" 
                  onClick={handlePasswordChange}
                  disabled={changingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                >
                  {changingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Update Password
                </Button>
              </div>
            </div>
            <TwoFactorAuth />
            <div className="metric-card">
              <h3 className="font-semibold mb-4">Session Management</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Auto Logout</p>
                    <p className="text-sm text-muted-foreground">Automatically logout after inactivity</p>
                  </div>
                  <Select value={autoLogoutTime} onValueChange={handleAutoLogoutChange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="license" className="space-y-6">
            <LicenseSettings />
            <LicensePlans />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
