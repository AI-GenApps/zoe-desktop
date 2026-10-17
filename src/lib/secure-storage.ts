import { Stronghold } from "@tauri-apps/plugin-stronghold";
import { isTauri } from "@tauri-apps/api/core";
import { appDataDir } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { saveKeychainToken, loadKeychainToken, deleteKeychainToken } from "./secure-storage-fallback";

export const STORAGE_KEY = "better_auth_session";

const STRONGHOLD_CLIENT = "zybernetix";
const STRONGHOLD_FILE = "stronghold.hold";
const STRONGHOLD_UNAVAILABLE_CODES = ["STRONGHOLD_UNAVAILABLE", "stronghold unavailable"];

function useWebStorage(): boolean {
  return !isTauri() && typeof localStorage !== "undefined";
}

async function getStrongholdStore() {
  const dataDir = await appDataDir();
  const vaultPath = `${dataDir}/${STRONGHOLD_FILE}`;
  const stronghold = await Stronghold.load(vaultPath, "");
  let client;
  try {
    client = await stronghold.loadClient(STRONGHOLD_CLIENT);
  } catch {
    client = await stronghold.createClient(STRONGHOLD_CLIENT);
  }
  return { store: client.getStore(), stronghold };
}

function isStrongholdUnavailable(err: unknown): boolean {
  if (typeof err === "string") {
    return STRONGHOLD_UNAVAILABLE_CODES.some((c) => err.toLowerCase().includes(c.toLowerCase()));
  }
  if (err instanceof Error) {
    return STRONGHOLD_UNAVAILABLE_CODES.some((c) => err.message.toLowerCase().includes(c.toLowerCase()));
  }
  return false;
}

export async function saveSessionToken(token: string): Promise<void> {
  if (useWebStorage()) {
    localStorage.setItem(STORAGE_KEY, token);
    console.info("session token saved (web storage)");
    return;
  }

  try {
    const { store, stronghold } = await getStrongholdStore();
    await store.insert(STORAGE_KEY, Array.from(new TextEncoder().encode(token)));
    await stronghold.save();
    console.info("session token saved");
  } catch (err) {
    if (isStrongholdUnavailable(err)) {
      await saveKeychainToken(STORAGE_KEY, token);
      console.info("session token saved (keychain fallback)");
      return;
    }
    if ((await platform()) === "linux") {
      console.warn(
        "Stronghold and OS keychain may be unavailable on Linux. " +
          "Falling back to keychain command — ensure a secret service daemon (e.g. gnome-keyring) is running."
      );
      await saveKeychainToken(STORAGE_KEY, token);
      console.info("session token saved (linux keychain fallback)");
      return;
    }
    throw err;
  }
}

export async function loadSessionToken(): Promise<string | null> {
  if (useWebStorage()) return localStorage.getItem(STORAGE_KEY);

  try {
    const { store } = await getStrongholdStore();
    const raw = await store.get(STORAGE_KEY);
    if (!raw) return null;
    return new TextDecoder().decode(Uint8Array.from(raw));
  } catch (err) {
    if (isStrongholdUnavailable(err) || (await platform()) === "linux") {
      return loadKeychainToken(STORAGE_KEY);
    }
    throw err;
  }
}

export async function deleteSessionToken(): Promise<void> {
  if (useWebStorage()) {
    localStorage.removeItem(STORAGE_KEY);
    console.info("session token deleted (web storage)");
    return;
  }

  try {
    const { store, stronghold } = await getStrongholdStore();
    await store.remove(STORAGE_KEY);
    await stronghold.save();
    console.info("session token deleted");
  } catch (err) {
    if (isStrongholdUnavailable(err) || (await platform()) === "linux") {
      await deleteKeychainToken(STORAGE_KEY);
      console.info("session token deleted (keychain fallback)");
      return;
    }
    throw err;
  }
}
