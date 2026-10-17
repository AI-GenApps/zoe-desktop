import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"]
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@tauri-apps/api/core": resolve(__dirname, "src/__mocks__/@tauri-apps/api/core.ts"),
      "@tauri-apps/api/path": resolve(__dirname, "src/__mocks__/@tauri-apps/api/path.ts"),
      "@tauri-apps/plugin-stronghold": resolve(__dirname, "src/__mocks__/@tauri-apps/plugin-stronghold.ts"),
      "@tauri-apps/plugin-os": resolve(__dirname, "src/__mocks__/@tauri-apps/plugin-os.ts"),
      "@tauri-apps/plugin-shell": resolve(__dirname, "src/__mocks__/@tauri-apps/plugin-shell.ts"),
      "@tauri-apps/plugin-notification": resolve(__dirname, "src/__mocks__/@tauri-apps/plugin-notification.ts"),
      "@tauri-apps/api/webviewWindow": resolve(__dirname, "src/__mocks__/@tauri-apps/api/webviewWindow.ts")
    }
  }
});
