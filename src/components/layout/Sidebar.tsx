import { NavLink } from "react-router";
import { Sun, Moon, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NAV_ITEMS, NAV_BOTTOM_ITEMS, type NavItem } from "@/config/nav";
import type { Theme } from "@/lib/theme";

interface SidebarProps {
  collapsed: boolean;
  theme: Theme;
  onCollapse: () => void;
  onToggleTheme: () => void;
}

function NavButton({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const btn = (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        cn(
          "flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
        )
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return btn;
}

export function Sidebar({ collapsed, theme, onCollapse, onToggleTheme }: SidebarProps) {
  return (
    <aside className={cn("flex flex-col border-r bg-card transition-all duration-200", collapsed ? "w-14" : "w-60")}>
      <div className="flex h-12 items-center justify-between px-2">
        <div className="flex min-w-0 items-center gap-2">
          <img
            src="/brand/zoe-agent.svg"
            alt={collapsed ? "Zoe Agent" : ""}
            width={28}
            height={28}
            className={cn("shrink-0", collapsed ? "h-4 w-4" : "h-7 w-7")}
          />
          {!collapsed && <span className="truncate text-sm font-semibold text-foreground">Zoe Agent</span>}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("shrink-0 ml-auto", collapsed && "h-6 w-6")}
        >
          {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
        </Button>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => (
          <NavButton key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <Separator />
      <div className="flex flex-col gap-1 p-2">
        {NAV_BOTTOM_ITEMS.map((item) => (
          <NavButton key={item.path} item={item} collapsed={collapsed} />
        ))}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={onToggleTheme} className="w-full justify-start gap-3 px-2">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              {!collapsed && <span className="text-sm">{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Toggle theme</TooltipContent>}
        </Tooltip>
      </div>
    </aside>
  );
}
