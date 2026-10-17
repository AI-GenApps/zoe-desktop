import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const { isOnline, queueDepth } = useOnlineStatus();

  if (isOnline) return null;

  const label = queueDepth > 0 ? `Offline — syncing later (${queueDepth} pending)` : "Offline — syncing later";

  return (
    <div className="sticky top-0 z-50 w-full bg-amber-100 dark:bg-amber-900/40 border-b border-amber-300 dark:border-amber-700 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:text-amber-200">
      {label}
    </div>
  );
}
