import { useState, useEffect } from "react";
import { statusStore } from "@/stores/status-store";

export function useBreak() {
  const [isOnBreak, setIsOnBreak] = useState(() => statusStore.get().isOnBreak);

  useEffect(() => {
    return statusStore.subscribe((s) => setIsOnBreak(s.isOnBreak));
  }, []);

  return {
    isOnBreak,
    startBreak: statusStore.startBreak,
    endBreak: statusStore.endBreak
  };
}
