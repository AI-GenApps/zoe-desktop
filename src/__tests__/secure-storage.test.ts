import { describe, it, expect, beforeEach, vi } from "vitest";
import { invoke, isTauri } from "@tauri-apps/api/core";
import {
  __setStrongholdShouldFail,
  __clearStore,
  mockStore,
  mockStronghold,
  Stronghold
} from "../__mocks__/@tauri-apps/plugin-stronghold";
import { __setPlatform } from "../__mocks__/@tauri-apps/plugin-os";

beforeEach(() => {
  vi.clearAllMocks();
  __clearStore();
  __setStrongholdShouldFail(false);
  __setPlatform("macos");
  vi.mocked(isTauri).mockReturnValue(true);
});

describe("saveSessionToken", () => {
  it("writes token to Stronghold store and saves the vault", async () => {
    const { saveSessionToken } = await import("../lib/secure-storage");
    await saveSessionToken("tok_abc");
    expect(mockStore.insert).toHaveBeenCalledWith("better_auth_session", expect.any(Array));
    expect(mockStronghold.save).toHaveBeenCalled();
  });

  it("falls back to OS keychain when Stronghold is unavailable", async () => {
    __setStrongholdShouldFail(true);
    vi.mocked(invoke).mockResolvedValue(undefined);
    const { saveSessionToken } = await import("../lib/secure-storage");
    await saveSessionToken("tok_fallback");
    expect(invoke).toHaveBeenCalledWith("save_keychain", { key: "better_auth_session", value: "tok_fallback" });
    expect(Stronghold.load).toHaveBeenCalled();
  });
});

describe("loadSessionToken", () => {
  it("reads and decodes a token from Stronghold store", async () => {
    const { saveSessionToken, loadSessionToken } = await import("../lib/secure-storage");
    await saveSessionToken("tok_load_test");
    const result = await loadSessionToken();
    expect(result).toBe("tok_load_test");
  });

  it("returns null when no token is stored", async () => {
    const { loadSessionToken } = await import("../lib/secure-storage");
    const result = await loadSessionToken();
    expect(result).toBeNull();
  });

  it("falls back to keychain when Stronghold is unavailable", async () => {
    __setStrongholdShouldFail(true);
    vi.mocked(invoke).mockResolvedValue("tok_from_keychain");
    const { loadSessionToken } = await import("../lib/secure-storage");
    const result = await loadSessionToken();
    expect(invoke).toHaveBeenCalledWith("load_keychain", { key: "better_auth_session" });
    expect(result).toBe("tok_from_keychain");
  });
});

describe("deleteSessionToken", () => {
  it("removes the token from Stronghold store", async () => {
    const { saveSessionToken, deleteSessionToken } = await import("../lib/secure-storage");
    await saveSessionToken("tok_delete_me");
    await deleteSessionToken();
    expect(mockStore.remove).toHaveBeenCalledWith("better_auth_session");
    expect(mockStronghold.save).toHaveBeenCalledTimes(2);
  });

  it("falls back to keychain delete when Stronghold is unavailable", async () => {
    __setStrongholdShouldFail(true);
    vi.mocked(invoke).mockResolvedValue(undefined);
    const { deleteSessionToken } = await import("../lib/secure-storage");
    await deleteSessionToken();
    expect(invoke).toHaveBeenCalledWith("delete_keychain", { key: "better_auth_session" });
  });
});

describe("web storage", () => {
  it("stores, loads, and deletes the session token in the web app", async () => {
    vi.mocked(isTauri).mockReturnValue(false);
    const { saveSessionToken, loadSessionToken, deleteSessionToken } = await import("../lib/secure-storage");

    await saveSessionToken("tok_web");
    expect(localStorage.getItem("better_auth_session")).toBe("tok_web");
    await expect(loadSessionToken()).resolves.toBe("tok_web");

    await deleteSessionToken();
    expect(localStorage.getItem("better_auth_session")).toBeNull();
    expect(invoke).not.toHaveBeenCalled();
  });
});
