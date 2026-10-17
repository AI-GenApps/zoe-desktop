import { useState, useEffect } from "react";
import { useBreak } from "@/hooks/useBreak";
import { Button } from "@/components/ui/button";

export function BreakOverlay() {
  const { isOnBreak, endBreak } = useBreak();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isOnBreak) {
      setElapsed(0);
      return;
    }
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isOnBreak]);

  if (!isOnBreak) return null;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const label = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <p className="mb-2 text-lg font-semibold text-foreground">On Break</p>
      <p className="mb-6 text-4xl font-mono text-muted-foreground">{label}</p>
      <Button onClick={() => endBreak()}>End Break</Button>
    </div>
  );
}
