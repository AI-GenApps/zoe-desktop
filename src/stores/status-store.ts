import type { UserStatus } from "@/types/protocol";
import { flushHeartbeat } from "@/services/heartbeat";
import { appEvents } from "@/lib/app-events";
import { resolveStatus } from "@/lib/status";

export interface StatusState {
  status: UserStatus;
  isOnBreak: boolean;
  isTrackingPaused: boolean;
  idleSeconds: number;
  idleThresholdSeconds: number;
  currentTaskTitle: string | null;
}

type Listener = (state: StatusState) => void;

const IDLE_THRESHOLD_KEY = "znx.idle_threshold_seconds";

let state: StatusState = {
  status: "active",
  isOnBreak: false,
  isTrackingPaused: false,
  idleSeconds: 0,
  idleThresholdSeconds: Number(localStorage.getItem(IDLE_THRESHOLD_KEY) ?? "300"),
  currentTaskTitle: null
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((l) => l(state));
}

function get(): StatusState {
  return state;
}

function set(patch: Partial<StatusState>) {
  state = { ...state, ...patch };
  notify();
}

function resolveAndSetStatus() {
  const { isTrackingPaused, isOnBreak, idleSeconds, idleThresholdSeconds } = get();
  const status = resolveStatus({ isPaused: isTrackingPaused, isOnBreak, idleSeconds, idleThresholdSeconds });
  set({ status });
  localStorage.setItem("znx.status", status);
}

async function startBreak(): Promise<void> {
  if (get().isTrackingPaused) return;
  set({ isOnBreak: true });
  resolveAndSetStatus();
  await flushHeartbeat("break_started");
  appEvents.emit("break:started");
}

async function endBreak(): Promise<void> {
  set({ isOnBreak: false });
  resolveAndSetStatus();
  await flushHeartbeat("break_ended");
  appEvents.emit("break:ended");
}

async function pauseTracking(): Promise<void> {
  set({ isTrackingPaused: true });
  resolveAndSetStatus();
  await flushHeartbeat("pause_started");
  appEvents.emit("pause:started");
}

async function resumeTracking(): Promise<void> {
  set({ isTrackingPaused: false });
  resolveAndSetStatus();
  await flushHeartbeat("pause_ended");
  appEvents.emit("pause:ended");
}

function setIdleSeconds(idleSeconds: number) {
  set({ idleSeconds });
  resolveAndSetStatus();
}

function setCurrentTaskTitle(title: string | null) {
  set({ currentTaskTitle: title });
}

function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const statusStore = {
  get,
  set,
  subscribe,
  resolveAndSetStatus,
  startBreak,
  endBreak,
  pauseTracking,
  resumeTracking,
  setIdleSeconds,
  setCurrentTaskTitle
};
