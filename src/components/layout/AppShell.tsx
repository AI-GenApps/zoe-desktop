import { useState, type ReactNode } from "react";
import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { BreakOverlay } from "./BreakOverlay";
import { OfflineBanner } from "@/components/OfflineBanner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTheme, toggleTheme } from "@/lib/theme";

interface AppShellProps {
  children?: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useTheme();

  function handleToggleTheme() {
    const next = toggleTheme();
    setTheme(next);
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar
          collapsed={collapsed}
          theme={theme}
          onCollapse={() => setCollapsed((c) => !c)}
          onToggleTheme={handleToggleTheme}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          <OfflineBanner />
          <main className="flex flex-1 flex-col overflow-y-auto">{children ?? <Outlet />}</main>
        </div>
        <BreakOverlay />
      </div>
    </TooltipProvider>
  );
}
