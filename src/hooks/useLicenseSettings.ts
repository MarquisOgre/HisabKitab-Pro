import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface LicenseSettings {
  id: string;
  user_id: string | null;
  user_email: string | null;
  expiry_date: string;
  license_type: string;
  licensed_to: string | null;
  support_email: string | null;
  support_phone: string | null;
  support_whatsapp: string | null;
  max_users: number | null;
  max_simultaneous_logins: number | null;
  created_at: string;
  updated_at: string;
}

export function useLicenseSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: licenseSettings, isLoading } = useQuery({
    queryKey: ["license-settings", user?.email, user?.id],
    queryFn: async () => {
      if (!user?.email || !user?.id) return null;

      // Use a SECURITY DEFINER function to safely resolve the effective license
      // (child accounts -> parent's license) without RLS blocking.
      const { data, error } = await supabase.rpc("get_effective_license_settings", {
        _user_id: user.id,
      });

      if (error) {
        console.error("Error fetching effective license settings:", error);
        return null;
      }

      const row = Array.isArray(data) ? data[0] : data;
      return (row ?? null) as LicenseSettings | null;
    },
    staleTime: 0,
    enabled: !!user?.email && !!user?.id,
  });

  const updateLicenseSettings = useMutation({
    mutationFn: async (updates: Partial<LicenseSettings>) => {
      if (!licenseSettings?.id) throw new Error("No license settings found");

      const { data, error } = await supabase
        .from("license_settings")
        .update(updates)
        .eq("id", licenseSettings.id)
        .select("*")
        .single();

      if (error) throw error;
      return data as LicenseSettings;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["license-settings", user?.email], updated);
      toast.success("License settings updated successfully");
    },
    onError: (error) => {
      console.error("Error updating license settings:", error);
      toast.error("Failed to update license settings");
    },
  });

  const isLicenseValid = () => {
    if (!licenseSettings) return false; // No license = not valid
    const expiryDate = new Date(licenseSettings.expiry_date);
    return new Date() <= expiryDate;
  };

  const getDaysRemaining = () => {
    if (!licenseSettings) return 0;
    const expiryDate = new Date(licenseSettings.expiry_date);
    const diff = expiryDate.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const formatExpiryDate = () => {
    if (!licenseSettings) return "";
    return new Date(licenseSettings.expiry_date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return {
    licenseSettings,
    isLoading,
    updateLicenseSettings,
    isLicenseValid,
    getDaysRemaining,
    formatExpiryDate,
  };
}
