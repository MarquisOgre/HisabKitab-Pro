import { Sidebar, useGlobalSidebarState } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { LicenseExpired } from "@/components/LicenseExpired";
import { LicenseReminder } from "@/components/LicenseReminder";
import { useLicenseSettings } from "@/hooks/useLicenseSettings";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { isSuperAdminEmail } from "@/lib/superadmin";

interface AppLayoutProps {
  children: React.ReactNode;
}

function AppLayoutContent({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const { isCollapsed } = useGlobalSidebarState();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <LicenseReminder />
      <Sidebar />
      <div className={cn(
        "min-h-screen pb-16 transition-all duration-300 overflow-x-hidden",
        isMobile ? "ml-0" : isCollapsed ? "ml-14" : "ml-64"
      )}>
        <Header />
        <main className="p-3 md:p-6 animate-fade-in overflow-x-hidden">{children}</main>
      </div>
      {/* Hide footer on mobile app view */}
      {!isMobile && <Footer />}
    </div>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isLicenseValid, isLoading } = useLicenseSettings();
  const { user } = useAuth();
  const isSuperAdmin = isSuperAdminEmail(user?.email);

  // SuperAdmin bypasses license check
  if (!isLoading && !isLicenseValid() && !isSuperAdmin) {
    return <LicenseExpired />;
  }

  return <AppLayoutContent>{children}</AppLayoutContent>;
}
