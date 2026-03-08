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
        // Use get_effective_license_settings which handles parent/child resolution
        const { data, error } = await supabase.rpc("get_effective_license_settings", {
          _user_id: user.id,
        });

        if (error) throw error;

        const row = Array.isArray(data) ? data[0] : data;
        // Check if the license belongs to a different user (inherited from parent)
        const isInherited = row?.user_id ? row.user_id !== user.id : false;
        setLicenseInfo({
          licenseType: row?.license_type ?? null,
          isInherited,
          parentEmail: isInherited ? (row?.user_email ?? null) : null,
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
