import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to get the admin (root) user ID for data operations.
 * Sub-users (supervisor/viewer) should save data under their admin's user_id.
 * This ensures all family members see the same shared business data.
 */
export function useAdminUserId() {
  const { user } = useAuth();
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminUserId() {
      if (!user) {
        setAdminUserId(null);
        setLoading(false);
        return;
      }

      try {
        // Call the database function to get the admin user ID
        const { data, error } = await supabase.rpc('get_admin_user_id', {
          _user_id: user.id
        });

        if (error) {
          console.error("Error fetching admin user ID:", error);
          // Fallback to current user ID
          setAdminUserId(user.id);
        } else {
          setAdminUserId(data || user.id);
        }
      } catch (err) {
        console.error("Error in useAdminUserId:", err);
        setAdminUserId(user.id);
      } finally {
        setLoading(false);
      }
    }

    fetchAdminUserId();
  }, [user]);

  return { adminUserId, loading, userId: user?.id };
}
