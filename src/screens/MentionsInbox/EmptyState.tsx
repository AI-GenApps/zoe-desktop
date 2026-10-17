import { BellIcon, CheckIcon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-16 text-center gap-4">
      <div className="relative">
        <BellIcon className="w-12 h-12 text-muted-foreground" />
        <CheckIcon className="w-5 h-5 text-green-500 absolute -bottom-1 -right-1 bg-background rounded-full" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">No mentions yet</h2>
      <p className="text-sm text-muted-foreground max-w-xs">You'll be notified when someone mentions you in Discord.</p>
    </div>
  );
}
