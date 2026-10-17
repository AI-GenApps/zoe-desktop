import { Button } from "@/components/ui/button";

const LAST_SEEN_KEY = "znx-last-seen-week";

interface Props {
  weekStart: string;
}

export function MondayBanner({ weekStart }: Props) {
  const lastSeen = localStorage.getItem(LAST_SEEN_KEY);
  if (lastSeen === weekStart) return null;

  function dismiss() {
    localStorage.setItem(LAST_SEEN_KEY, weekStart);
    window.dispatchEvent(new Event("znx-banner-dismiss"));
  }

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
      <span>🗓 New week started — plan your tasks for the week!</span>
      <Button variant="ghost" size="sm" onClick={dismiss} className="ml-4 shrink-0">
        Dismiss
      </Button>
    </div>
  );
}
