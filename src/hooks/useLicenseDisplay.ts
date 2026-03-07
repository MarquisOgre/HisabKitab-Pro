// @ts-nocheck
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
interface LicenseDisplayInfo {
  licenseType: string | null;
  isInherited: boolean;
  parentEmail: string | null;
  isLoading: boolean;
}

export function useLicenseDisplay(): LicenseDisplayInfo {
  const { user } = useAuth();
  const [licenseInfo, setLicenseInfo] = useState<LicenseDisplayInfo>({
    licenseType: null,
    isInherited: false,
    parentEmail: null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchLicenseInfo = async () => {
      if (!user?.email || !user?.id) {
        setLicenseInfo(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Use a SECURITY DEFINER database function to avoid RLS blocking child accounts
        const { data, error } = await supabase.rpc("get_license_display_info", {
          _user_id: user.id,
        });

        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        setLicenseInfo({
          licenseType: row?.license_type ?? null,
          isInherited: !!row?.is_inherited,
          parentEmail: row?.parent_email ?? null,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error fetching license display info:", error);
        setLicenseInfo({
          licenseType: null,
          isInherited: false,
          parentEmail: null,
          isLoading: false,
        });
      }
    };

    fetchLicenseInfo();
  }, [user?.email, user?.id]);

  return licenseInfo;
}
