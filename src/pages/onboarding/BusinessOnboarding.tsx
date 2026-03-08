import { useState, useEffect } from "react";
import { Building2, ArrowRight, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useBusinessSelection } from "@/contexts/BusinessSelectionContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { isSuperAdminEmail } from "@/lib/superadmin";

export default function BusinessOnboarding() {
  const { createBusiness, businesses, loading: businessLoading } =
    useBusinessSelection();
  const { user, signOut, isAdmin } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);
  const canCreateBusiness = isAdmin || isSuperAdmin;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isChildAccount, setIsChildAccount] = useState<boolean | null>(null);
  const [checkingChildStatus, setCheckingChildStatus] = useState(true);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to log out");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check if user is a child account (has parent_user_id)
  useEffect(() => {
    const checkChildStatus = async () => {
      if (!user) {
        setCheckingChildStatus(false);
        return;
      }

      try {
        // Check if user has a parent_user_id in user_roles or profiles
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("parent_user_id, role")
          .eq("user_id", user.id)
          .maybeSingle();

        // If user has a parent_user_id, they are a child account
        if (roleData?.parent_user_id) {
          setIsChildAccount(true);
        } else {
          // Also check profiles table
          const { data: profileData } = await supabase
            .from("profiles")
            .select("parent_user_id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          setIsChildAccount(!!profileData?.parent_user_id);
        }
      } catch (error) {
        console.error("Error checking child status:", error);
        setIsChildAccount(false);
      } finally {
        setCheckingChildStatus(false);
      }
    };

    checkChildStatus();
  }, [user]);

  // Redirect child accounts directly to dashboard (they share parent's businesses)
  useEffect(() => {
    if (!checkingChildStatus && isChildAccount && !businessLoading) {
      // Child accounts should go to dashboard - they'll see parent's businesses via RLS
      navigate("/dashboard", { replace: true });
    }
  }, [isChildAccount, checkingChildStatus, businessLoading, navigate]);

  // Redirect to dashboard if user already has businesses
  useEffect(() => {
    if (!businessLoading && businesses.length > 0) {
      navigate("/dashboard", { replace: true });
    }
  }, [businesses, businessLoading, navigate]);

  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    pan: "",
    email: user?.email || "",
    phone: "",
    address: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    if (!canCreateBusiness) {
      toast.error("Only admins can create businesses");
      return;
    }

    setLoading(true);
    try {
      const business = await createBusiness(formData);
      if (business) {
        navigate("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking for existing businesses or child status
  if (businessLoading || checkingChildStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render the form if user is a child account (redirect will happen)
  if (isChildAccount) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Don't render the form if user already has businesses
  if (businesses.length > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isDark = document.documentElement.classList.contains("dark");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      {/* Logout Button - Top Right */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>

      <div className="w-full max-w-lg">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img
              src={
                isDark
                  ? "/hisabkitab_light_logo.png"
                  : "/hisabkitab_dark_logo.png"
              }
              alt="hisabkitab Logo"
              className="h-32 w-auto"
            />
          </div>

          <h1 className="text-3xl font-bold mb-2">
            Welcome to Hisab Kitab Pro!
          </h1>
          <p className="text-muted-foreground">
            Let's set up your first business to get started
          </p>
        </div>

        <Card className="shadow-lg border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Create Your Business
            </CardTitle>
            <CardDescription>
              Enter your business details. You can add more businesses later.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter your business name"
                  required
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN (Optional)</Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gstin: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pan">PAN (Optional)</Label>
                  <Input
                    id="pan"
                    value={formData.pan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pan: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="AAAAA0000A"
                    maxLength={10}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="business@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Business Address (Optional)</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter your business address"
                  rows={2}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Button
                    type="submit"
                    className="flex-1 btn-gradient gap-2"
                    disabled={loading || !formData.name.trim() || !canCreateBusiness}
                  >
                    {loading ? "Creating..." : "Create Business & Continue"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  {!canCreateBusiness && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-4 h-4 rounded-full bg-muted flex items-center justify-center text-xs">ℹ</span>
                      Only admins can create businesses
                    </p>
                  )}
                </div>
                {isSuperAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigate("/dashboard")}
                  >
                    Skip to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          You can manage multiple businesses from the header dropdown
        </p>
      </div>
    </div>
  );
}
