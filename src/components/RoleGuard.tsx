import { useAuth } from "@/contexts/AuthContext";
import { ReactNode } from "react";

type AppRole = "admin" | "supervisor" | "viewer";

interface RoleGuardProps {
  children: ReactNode;
  /** Roles that are allowed to see the content */
  allowedRoles?: AppRole[];
  /** Shortcut: only show if user can write (admin or supervisor) */
  requireWrite?: boolean;
  /** Shortcut: only show if user is admin */
  requireAdmin?: boolean;
  /** Fallback content to render when access is denied */
  fallback?: ReactNode;
}

/**
 * Component to conditionally render UI based on user role
 * 
 * Usage:
 * - <RoleGuard requireWrite>...</RoleGuard> - Shows for admin/supervisor only
 * - <RoleGuard requireAdmin>...</RoleGuard> - Shows for admin only  
 * - <RoleGuard allowedRoles={["admin", "supervisor"]}>...</RoleGuard> - Custom roles
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  requireWrite, 
  requireAdmin,
  fallback = null 
}: RoleGuardProps) {
  const { role, canWrite, isAdmin } = useAuth();

  // Check access based on props
  if (requireAdmin) {
    return isAdmin ? <>{children}</> : <>{fallback}</>;
  }

  if (requireWrite) {
    return canWrite ? <>{children}</> : <>{fallback}</>;
  }

  if (allowedRoles && role) {
    return allowedRoles.includes(role) ? <>{children}</> : <>{fallback}</>;
  }

  // If no restrictions specified, show content
  if (!allowedRoles && !requireWrite && !requireAdmin) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Hook to check role permissions programmatically
 */
export function useRoleAccess() {
  const { role, canWrite, isAdmin } = useAuth();

  return {
    role,
    canWrite,
    isAdmin,
    hasRole: (roles: AppRole[]) => role ? roles.includes(role) : false,
    isViewer: role === "viewer",
    isSupervisor: role === "supervisor",
  };
}
