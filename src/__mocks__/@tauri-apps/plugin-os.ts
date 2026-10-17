import { vi } from "vitest";

let _platform = "macos";
export function __setPlatform(p: string) {
  _platform = p;
}
export const platform = vi.fn(async () => _platform);
