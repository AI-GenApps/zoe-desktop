import { useState, useEffect } from "react";
import { statusStore } from "@/stores/status-store";

export function usePause() {
  const [isTrackingPaused, setIsTrackingPaused] = useState(() => statusStore.get().isTrackingPaused);

  useEffect(() => {
    return statusStore.subscribe((s) => setIsTrackingPaused(s.isTrackingPaused));
  }, []);

  return {
    isTrackingPaused,
    pauseTracking: statusStore.pauseTracking,
    resumeTracking: statusStore.resumeTracking
  };
}
