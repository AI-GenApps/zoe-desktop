import { Separator } from "@/components/ui/separator";
import { AutostartToggle } from "@/components/settings/AutostartToggle";
import { UpdateChecker } from "@/components/settings/UpdateChecker";
import { NotificationSection } from "@/components/settings/NotificationSection";

export function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your application preferences</p>
      </div>
      <Separator />
      <section className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Startup</h3>
        <AutostartToggle />
      </section>
      <Separator />
      <section className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notifications</h3>
        <NotificationSection />
      </section>
      <Separator />
      <section className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">About</h3>
        <UpdateChecker />
      </section>
    </div>
  );
}
