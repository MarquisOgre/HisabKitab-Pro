import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTracking } from "@/hooks/useSessionTracking";

type AppRole = "admin" | "supervisor" | "viewer";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  sessionError: string | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  canWrite: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // IMPORTANT: session tracking must run only when an authenticated session exists
  // to avoid RLS errors caused by missing auth context.
  const { registerSession, removeSession } = useSessionTracking(session?.user?.id);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }
      return (data?.role as AppRole | null) ?? null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  };

  // Register session after successful login
  const handleSessionRegistration = useCallback(async () => {
    if (!session?.user) return;

    const result = await registerSession();

    if (!result.success && result.error !== "No user") {
      setSessionError(result.error || "Session limit reached");

      // Only force sign-out if it's clearly a session-limit issue.
      // For transient/permission errors (e.g., RLS), keep the user logged in
      // and show the error instead of causing a logout loop.
      const isLimitError = (result.error || "").toLowerCase().includes("maximum");
      if (isLimitError) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
      }
    } else {
      setSessionError(null);
    }
  }, [session, registerSession]);

  useEffect(() => {
    // Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Defer role fetching
      if (session?.user) {
        setTimeout(() => {
          fetchUserRole(session.user.id).then(setRole);
        }, 0);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id).then(setRole);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Register session when user logs in
  useEffect(() => {
    if (session?.user && !loading) {
      handleSessionRegistration();
    }
  }, [session, loading, handleSessionRegistration]);

  const signIn = async (email: string, password: string) => {
    setSessionError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await removeSession();
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setSessionError(null);
  };

  const canWrite = role === "admin" || role === "supervisor";
  const isAdmin = role === "admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        sessionError,
        signIn,
        signUp,
        signOut,
        canWrite,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

