import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SESSION_ID_KEY = "hisabkitab_session_id";
const HEARTBEAT_INTERVAL = 60000; // 1 minute

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const browser = ua.includes("Chrome") ? "Chrome" : 
                  ua.includes("Firefox") ? "Firefox" : 
                  ua.includes("Safari") ? "Safari" : 
                  ua.includes("Edge") ? "Edge" : "Unknown";
  const platform = navigator.platform || "Unknown";
  return `${browser} on ${platform}`;
}

export function useSessionTracking(userId: string | undefined) {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const registeredRef = useRef<boolean>(false);

  const registerSession = useCallback(async (userEmail?: string) => {
    if (!userId) return { success: false, error: "No user" };

    const { isSuperAdminEmail } = await import("@/lib/superadmin");
    const isSuperAdmin = isSuperAdminEmail(userEmail);

    // Check if we already have a registered session for this browser tab
    const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (existingSessionId && registeredRef.current) {
      // Already registered in this tab, just update heartbeat
      return { success: true };
    }

    // Small delay to let the Supabase auth context propagate (avoids RLS race condition)
    await new Promise((r) => setTimeout(r, 300));

    try {
      // SuperAdmin has unlimited simultaneous logins
      let maxLogins = 10; // default for regular admins
      
      if (!isSuperAdmin) {
        // Get license settings for max simultaneous logins
        const { data: licenseSettings } = await supabase
          .from("license_settings")
          .select("max_simultaneous_logins")
          .limit(1)
          .single();

        maxLogins = licenseSettings?.max_simultaneous_logins || 10;
      }

      // Clean up old sessions for THIS user only (older than 5 minutes without activity)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await supabase
        .from("active_sessions")
        .delete()
        .eq("user_id", userId)
        .lt("last_activity", fiveMinutesAgo);

      // If we have an existing session ID from this tab, check if it still exists
      if (existingSessionId) {
        const { data: existingSession } = await supabase
          .from("active_sessions")
          .select("id")
          .eq("session_id", existingSessionId)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingSession) {
          // Session still exists, just mark as registered and update heartbeat
          sessionIdRef.current = existingSessionId;
          registeredRef.current = true;
          await supabase
            .from("active_sessions")
            .update({ last_activity: new Date().toISOString() })
            .eq("session_id", existingSessionId)
            .eq("user_id", userId);
          return { success: true };
        }
      }

      // Count current active sessions for this user (SuperAdmin bypasses this check)
      if (!isSuperAdmin) {
        const { count } = await supabase
          .from("active_sessions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        // Check if adding a new session would exceed the limit
        if (count !== null && count >= maxLogins) {
          return {
            success: false,
            error: `Maximum ${maxLogins} simultaneous login(s) allowed. Please log out from another device.`,
          };
        }
      }

      // Generate new session ID
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);

      // Register the session
      const { error } = await supabase.from("active_sessions").insert({
        user_id: userId,
        session_id: sessionId,
        device_info: getDeviceInfo(),
        last_activity: new Date().toISOString(),
      });

      if (error) {
        // Suppress transient RLS errors – session tracking is non-critical
        if (error.message?.toLowerCase().includes("row-level security")) {
          console.warn("RLS race condition on session insert – skipping:", error.message);
          return { success: true }; // Treat as success to avoid blocking the user
        }
        console.error("Error registering session:", error);
        return { success: false, error: error.message };
      }

      registeredRef.current = true;
      return { success: true };
    } catch (error: any) {
      console.error("Session registration error:", error);
      return { success: false, error: error.message };
    }
  }, [userId]);

  const updateHeartbeat = useCallback(async () => {
    const sessionId = sessionIdRef.current || sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId || !userId) return;

    try {
      await supabase
        .from("active_sessions")
        .update({ last_activity: new Date().toISOString() })
        .eq("session_id", sessionId)
        .eq("user_id", userId);
    } catch (error) {
      console.error("Heartbeat update error:", error);
    }
  }, [userId]);

  const removeSession = useCallback(async () => {
    const sessionId = sessionIdRef.current || sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId || !userId) return;

    try {
      await supabase
        .from("active_sessions")
        .delete()
        .eq("session_id", sessionId)
        .eq("user_id", userId);

      sessionStorage.removeItem(SESSION_ID_KEY);
      sessionIdRef.current = null;
    } catch (error) {
      console.error("Session removal error:", error);
    }
  }, [userId]);

  // Start heartbeat when component mounts
  useEffect(() => {
    if (!userId) return;

    // Start heartbeat interval
    heartbeatRef.current = setInterval(updateHeartbeat, HEARTBEAT_INTERVAL);

    // Handle page unload
    const handleUnload = () => {
      // Use sendBeacon for reliable session cleanup
      const sessionId = sessionIdRef.current || sessionStorage.getItem(SESSION_ID_KEY);
      if (sessionId) {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/active_sessions?session_id=eq.${sessionId}`,
          JSON.stringify({ _method: "DELETE" })
        );
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [userId, updateHeartbeat]);

  return {
    registerSession,
    removeSession,
    updateHeartbeat,
  };
}

export async function checkMaxUsers(currentUserEmail?: string): Promise<{ allowed: boolean; error?: string }> {
  const { isSuperAdminEmail } = await import("@/lib/superadmin");
  
  // SuperAdmin can create unlimited users
  if (isSuperAdminEmail(currentUserEmail)) {
    return { allowed: true };
  }

  try {
    // Get license settings for max users
    const { data: licenseSettings } = await supabase
      .from("license_settings")
      .select("max_users")
      .limit(1)
      .single();

    // Default is 2 users for regular admins
    const maxUsers = licenseSettings?.max_users || 2;

    // Count current users created by this admin (family members)
    // For now, count all users but this should ideally count only users in the same family
    const { count } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true });

    if (count !== null && count >= maxUsers) {
      return { 
        allowed: false, 
        error: `Maximum ${maxUsers} user(s) allowed under current license. Please upgrade to add more users.` 
      };
    }

    return { allowed: true };
  } catch (error: any) {
    console.error("Error checking max users:", error);
    return { allowed: true }; // Allow on error to not block
  }
}
