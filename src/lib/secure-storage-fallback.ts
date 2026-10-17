import { invoke } from "@tauri-apps/api/core";

// OS keychain fallback via custom Rust commands (keyring crate, service: "zybernetix-desktop").
// Used when Stronghold is unavailable (e.g., first run on a machine where the vault
// has not yet been initialised, or on Linux without a secret service daemon).

export async function saveKeychainToken(key: string, value: string): Promise<void> {
  await invoke<void>("save_keychain", { key, value });
}

export async function loadKeychainToken(key: string): Promise<string | null> {
  return invoke<string | null>("load_keychain", { key });
}

export async function deleteKeychainToken(key: string): Promise<void> {
  await invoke<void>("delete_keychain", { key });
}
