import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <AppHeader sidebarCollapsed={sidebarCollapsed} />
      <main
        className="pt-16 transition-all duration-250 min-h-screen"
        style={{ marginLeft: sidebarCollapsed ? 68 : 260 }}
      >
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
