import { useAutostart } from "@/hooks/useAutostart";
import { Switch } from "@/components/ui/switch";

export function AutostartToggle() {
  const { autostartEnabled, toggle, loading } = useAutostart();

  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Launch at login</p>
        <p className="text-xs text-muted-foreground">Automatically start Zoe Agent when you log in</p>
      </div>
      {loading ? (
        <div className="h-5 w-9 animate-pulse rounded-full bg-muted" />
      ) : (
        <Switch checked={autostartEnabled} onCheckedChange={() => toggle()} />
      )}
    </div>
  );
}
