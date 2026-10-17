import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { checkForUpdate, downloadAndInstall, type UpdateInfo, type UpdateStatus } from "@/lib/updater";

const STATUS_LABELS: Record<UpdateStatus, string> = {
  idle: "",
  checking: "Checking...",
  "up-to-date": "Up to date",
  available: "Update available",
  downloading: "Downloading...",
  relaunching: "Relaunching...",
  error: "Could not check for updates"
};

const STATUS_VARIANTS: Partial<Record<UpdateStatus, "default" | "secondary" | "destructive">> = {
  available: "default",
  error: "destructive",
  "up-to-date": "secondary"
};

export function UpdateChecker() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  async function handleCheck() {
    const info = await checkForUpdate(setStatus);
    setUpdateInfo(info);
  }

  async function handleInstall() {
    await downloadAndInstall(setStatus);
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">Application updates</p>
        {updateInfo?.version && <p className="text-xs text-muted-foreground">Version {updateInfo.version} available</p>}
        {status !== "idle" && STATUS_LABELS[status] && (
          <Badge variant={STATUS_VARIANTS[status] ?? "secondary"} className="text-xs">
            {STATUS_LABELS[status]}
          </Badge>
        )}
      </div>
      <div className="flex gap-2">
        {updateInfo?.available ? (
          <Button size="sm" onClick={handleInstall} disabled={status === "downloading" || status === "relaunching"}>
            Install update
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={handleCheck} disabled={status === "checking"}>
            Check for update
          </Button>
        )}
      </div>
    </div>
  );
}
