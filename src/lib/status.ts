import type { UserStatus } from "@/types/protocol";

export interface ResolveStatusInput {
  isPaused: boolean;
  isOnBreak: boolean;
  idleSeconds: number;
  idleThresholdSeconds: number;
}

export function resolveStatus(input: ResolveStatusInput): UserStatus {
  const { isPaused, isOnBreak, idleSeconds, idleThresholdSeconds } = input;
  if (isPaused) return "paused";
  if (isOnBreak) return "on_break";
  if (idleSeconds >= idleThresholdSeconds) return "idle";
  return "active";
}
