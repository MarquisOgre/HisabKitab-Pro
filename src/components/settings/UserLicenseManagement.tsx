import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Shield, Mail, Calendar, Users, Edit, Plus, Loader2, CheckCircle, XCircle, AlertTriangle, Trash2, Ban, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { isSuperAdminEmail } from "@/lib/superadmin";

interface UserLicense {
  id: string;
  user_id: string | null;
  user_email: string | null;
  expiry_date: string;
  license_type: string;
  licensed_to: string | null;
  max_users: number | null;
  max_simultaneous_logins: number | null;
  max_businesses: number | null;
  created_at: string;
  updated_at: string;
}

interface LicensePlan {
  id: string;
  plan_name: string;
  duration_days: number;
  price: number;
  is_active: boolean;
}

interface UserProfile {
  user_id: string;
  email: string;
  full_name: string | null;
}

export function UserLicenseManagement() {
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);

  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [plans, setPlans] = useState<LicensePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<UserLicense | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingLicense, setDeletingLicense] = useState<UserLicense | null>(null);
  const [deletingFull, setDeletingFull] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [reissuing, setReissuing] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    user_email: "",
    expiry_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
    license_type: "Professional",
    max_users: 5,
    max_simultaneous_logins: 3,
    max_businesses: 3,
  });

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [licensesRes, profilesRes, plansRes] = await Promise.all([
        supabase.from("license_settings").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, email, full_name").order("email"),
        supabase.from("license_plans").select("*").eq("is_active", true).order("sort_order"),
      ]);

      if (licensesRes.error) throw licensesRes.error;
      setLicenses(licensesRes.data || []);
      if (profilesRes.error) throw profilesRes.error;
      setUsers(profilesRes.data || []);
      if (plansRes.data) setPlans(plansRes.data);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load license data");
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingLicense(null);
    setFormData({
      user_email: "",
      expiry_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      license_type: "Professional",
      max_users: 5,
      max_simultaneous_logins: 3,
      max_businesses: 3,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (license: UserLicense) => {
    setEditingLicense(license);
    setFormData({
      user_email: license.user_email || "",
      expiry_date: license.expiry_date,
      license_type: license.license_type,
      max_users: license.max_users || 5,
      max_simultaneous_logins: license.max_simultaneous_logins || 3,
      max_businesses: license.max_businesses || 3,
    });
    setDialogOpen(true);
  };

  const handlePlanSelect = (planId: string) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const newExpiryDate = addDays(new Date(), plan.duration_days);
    setFormData((prev) => ({
      ...prev,
      expiry_date: format(newExpiryDate, "yyyy-MM-dd"),
      license_type: plan.plan_name,
    }));
  };

  const handleRevoke = async (license: UserLicense) => {
    setRevoking(license.id);
    try {
      const { error } = await supabase
        .from("license_settings")
        .update({
          expiry_date: format(new Date(), "yyyy-MM-dd"),
          license_type: "Revoked",
        })
        .eq("id", license.id);

      if (error) throw error;
      toast.success(`License revoked for ${license.user_email}`);
      fetchData();
    } catch (error: any) {
      console.error("Error revoking license:", error);
      toast.error("Failed to revoke license");
    } finally {
      setRevoking(null);
    }
  };

  const handleReissue = async (license: UserLicense) => {
    setReissuing(license.id);
    try {
      const newExpiry = addDays(new Date(), 365);
      const { error } = await supabase
        .from("license_settings")
        .update({
          expiry_date: format(newExpiry, "yyyy-MM-dd"),
          license_type: license.license_type === "Revoked" ? "Professional" : license.license_type,
        })
        .eq("id", license.id);

      if (error) throw error;
      toast.success(`License reissued for ${license.user_email} (1 year)`);
      fetchData();
    } catch (error: any) {
      console.error("Error reissuing license:", error);
      toast.error("Failed to reissue license");
    } finally {
      setReissuing(null);
    }
  };

  const handleDeleteFull = async () => {
    if (!deletingLicense) return;
    setDeletingFull(true);
    try {
      // Find user_id from profiles by email
      const targetUser = users.find(u => u.email === deletingLicense.user_email);
      
      if (targetUser) {
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await supabase.functions.invoke('delete-user-account', {
          body: { userId: targetUser.user_id },
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`
          }
        });

        if (response.error) throw new Error(response.error.message);
        const result = response.data;
        if (result?.warnings?.length) {
          console.warn("Delete warnings:", result.warnings);
        }
        toast.success(`Account and all records deleted for ${deletingLicense.user_email}`);
      } else {
        // No profile found, just delete the license
        const { error } = await supabase.from("license_settings").delete().eq("id", deletingLicense.id);
        if (error) throw error;
        toast.success("License deleted (no user account found)");
      }

      setDeleteConfirmOpen(false);
      setDeletingLicense(null);
      fetchData();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete: " + error.message);
    } finally {
      setDeletingFull(false);
    }
  };

  const handleSave = async () => {
    if (!formData.user_email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    setSaving(true);
    try {
      const targetUser = users.find(u => u.email === formData.user_email);
      
      if (editingLicense) {
        const { error } = await supabase
          .from("license_settings")
          .update({
            user_email: formData.user_email,
            user_id: targetUser?.user_id || null,
            expiry_date: formData.expiry_date,
            license_type: formData.license_type,
            licensed_to: formData.user_email,
            max_users: formData.max_users,
            max_simultaneous_logins: formData.max_simultaneous_logins,
            max_businesses: formData.max_businesses,
          })
          .eq("id", editingLicense.id);

        if (error) throw error;
        toast.success("License updated successfully");
      } else {
        const existingLicense = licenses.find(l => l.user_email === formData.user_email);
        if (existingLicense) {
          toast.error("A license already exists for this email");
          setSaving(false);
          return;
        }

        const { error } = await supabase
          .from("license_settings")
          .insert({
            user_email: formData.user_email,
            user_id: targetUser?.user_id || null,
            expiry_date: formData.expiry_date,
            license_type: formData.license_type,
            licensed_to: formData.user_email,
            max_users: formData.max_users,
            max_simultaneous_logins: formData.max_simultaneous_logins,
            max_businesses: formData.max_businesses,
          });

        if (error) throw error;
        toast.success("License created successfully");
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error("Error saving license:", error);
      toast.error("Failed to save license");
    } finally {
      setSaving(false);
    }
  };

  const getLicenseStatus = (expiryDate: string, licenseType: string) => {
    if (licenseType === "Revoked") {
      return { status: "revoked", label: "Revoked", variant: "destructive" as const, icon: Ban };
    }
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysRemaining = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { status: "expired", label: "Expired", variant: "destructive" as const, icon: XCircle };
    } else if (daysRemaining <= 30) {
      return { status: "expiring", label: `${daysRemaining} days`, variant: "secondary" as const, icon: AlertTriangle };
    } else {
      return { status: "active", label: "Active", variant: "default" as const, icon: CheckCircle };
    }
  };

  if (!isSuperAdmin) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              User License Management
            </CardTitle>
            <CardDescription>
              Manage licenses for all registered users by email
            </CardDescription>
          </div>
          <Button onClick={openAddDialog} className="btn-gradient gap-2">
            <Plus className="w-4 h-4" />
            Issue License
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {licenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No licenses issued yet</p>
            <p className="text-sm">Click "Issue License" to create a new license</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>License Type</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Max Users</TableHead>
                  <TableHead>Logins</TableHead>
                  <TableHead>Businesses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => {
                  const statusInfo = getLicenseStatus(license.expiry_date, license.license_type);
                  const StatusIcon = statusInfo.icon;
                  const isRevoked = license.license_type === "Revoked";
                  const isExpired = statusInfo.status === "expired";
                  return (
                    <TableRow key={license.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{license.user_email || "Not assigned"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{license.license_type}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(license.expiry_date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{license.max_users || 5}</TableCell>
                      <TableCell>{license.max_simultaneous_logins || 3}</TableCell>
                      <TableCell>{license.max_businesses || 3}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(license)}
                            className="gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          {!isRevoked && !isExpired && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(license)}
                              disabled={revoking === license.id}
                              className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              {revoking === license.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                              Revoke
                            </Button>
                          )}
                          {(isRevoked || isExpired) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReissue(license)}
                              disabled={reissuing === license.id}
                              className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              {reissuing === license.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                              Reissue
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeletingLicense(license);
                              setDeleteConfirmOpen(true);
                            }}
                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-destructive">Delete User Account</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  This will <strong>permanently delete</strong> the account for{" "}
                  <strong>{deletingLicense?.user_email}</strong> and remove{" "}
                  <strong>ALL their data</strong> from the database including:
                </p>
                <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                  <li>All invoices (sales & purchases)</li>
                  <li>All items, parties, and categories</li>
                  <li>All payments and transactions</li>
                  <li>All businesses and settings</li>
                  <li>License and user profile</li>
                  <li>Auth account</li>
                </ul>
                <p className="text-destructive font-semibold mt-2">
                  This action cannot be undone!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFull}
                disabled={deletingFull}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingFull ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete Everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit License Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingLicense ? "Edit License" : "Issue New License"}
              </DialogTitle>
              <DialogDescription>
                {editingLicense
                  ? "Update the license details for this user"
                  : "Issue a new license to a user by their email address"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>User Email *</Label>
                <Select
                  value={formData.user_email}
                  onValueChange={(value) => setFormData({ ...formData, user_email: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user email..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.user_id} value={u.email}>
                        {u.email} {u.full_name && `(${u.full_name})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>License Plan</Label>
                <Select onValueChange={handlePlanSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan to auto-fill..." />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.plan_name} - {plan.duration_days} Days
                        {plan.price > 0 ? ` (₹${plan.price.toLocaleString()})` : " (Free)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>License Type</Label>
                  <Input
                    value={formData.license_type}
                    onChange={(e) => setFormData({ ...formData, license_type: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Users</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_users}
                    onChange={(e) => setFormData({ ...formData, max_users: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Simultaneous Logins</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_simultaneous_logins}
                    onChange={(e) =>
                      setFormData({ ...formData, max_simultaneous_logins: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Businesses</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.max_businesses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_businesses: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="btn-gradient">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingLicense ? "Update License" : "Issue License"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
