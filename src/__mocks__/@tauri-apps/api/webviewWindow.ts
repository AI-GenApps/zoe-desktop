import { vi } from "vitest";

const mockWindow = {
  show: vi.fn().mockResolvedValue(undefined),
  setFocus: vi.fn().mockResolvedValue(undefined)
};

export const getCurrentWebviewWindow = vi.fn(() => mockWindow);
export { mockWindow };
