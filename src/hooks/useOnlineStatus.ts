import { useState, useEffect, useCallback, useRef } from "react";
import { syncQueue } from "@/lib/sync-queue/SyncQueue";
import { triggerFlush } from "@/lib/sync-queue/flushWorker";

const FAILURE_THRESHOLD = 3;
const QUEUE_POLL_INTERVAL_MS = 30_000;

export interface OnlineStatus {
  isOnline: boolean;
  queueDepth: number;
  reportFetchSuccess: () => void;
  reportFetchFailure: () => void;
}

export function useOnlineStatus(): OnlineStatus {
  const [navOnline, setNavOnline] = useState(() => navigator.onLine);
  const [consecutiveFailures, setConsecutiveFailures] = useState(0);
  const [queueDepth, setQueueDepth] = useState(0);
  const wasOnline = useRef(true);

  const isOnline = navOnline && consecutiveFailures < FAILURE_THRESHOLD;

  const refreshQueueDepth = useCallback(async () => {
    const count = await syncQueue.pendingCount();
    setQueueDepth(count);
  }, []);

  useEffect(() => {
    const handleOnline = () => setNavOnline(true);
    const handleOffline = () => setNavOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const id = setInterval(refreshQueueDepth, QUEUE_POLL_INTERVAL_MS);
    refreshQueueDepth();
    return () => clearInterval(id);
  }, [refreshQueueDepth]);

  useEffect(() => {
    if (!wasOnline.current && isOnline) {
      triggerFlush();
      refreshQueueDepth();
    }
    wasOnline.current = isOnline;
  }, [isOnline, refreshQueueDepth]);

  const reportFetchSuccess = useCallback(() => {
    setConsecutiveFailures(0);
  }, []);

  const reportFetchFailure = useCallback(() => {
    setConsecutiveFailures((n) => n + 1);
  }, []);

  return { isOnline, queueDepth, reportFetchSuccess, reportFetchFailure };
}
