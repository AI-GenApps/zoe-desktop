import { beforeEach, describe, expect, it, vi } from "vitest";

const sqlMocks = vi.hoisted(() => ({
  load: vi.fn(),
  db: {
    execute: vi.fn(),
    select: vi.fn()
  }
}));

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: { load: sqlMocks.load }
}));

describe("getDb", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    sqlMocks.load.mockResolvedValue(sqlMocks.db);
    sqlMocks.db.execute.mockResolvedValue({ rowsAffected: 0 });
    sqlMocks.db.select.mockResolvedValue([{ name: "guild_id" }, { name: "guild_name" }]);
  });

  it("shares initialization until migrations complete before returning the database", async () => {
    let releaseMigration!: () => void;
    const migrationGate = new Promise<void>((resolve) => {
      releaseMigration = resolve;
    });
    sqlMocks.db.execute.mockImplementationOnce(() => migrationGate);

    const { getDb } = await import("./db");
    const first = getDb();
    await vi.waitFor(() => expect(sqlMocks.db.execute).toHaveBeenCalledTimes(1));

    const second = getDb();
    const secondSettled = await Promise.race([second.then(() => true), Promise.resolve(false)]);
    expect(secondSettled).toBe(false);
    expect(sqlMocks.load).toHaveBeenCalledTimes(1);

    releaseMigration();
    await expect(first).resolves.toBe(sqlMocks.db);
    await expect(second).resolves.toBe(sqlMocks.db);
    expect(sqlMocks.db.execute).toHaveBeenCalledTimes(1);
  });

  it("allows a later caller to retry after initialization fails", async () => {
    sqlMocks.load.mockRejectedValueOnce(new Error("SQLite unavailable"));

    const { getDb } = await import("./db");
    await expect(getDb()).rejects.toThrow("SQLite unavailable");
    await expect(getDb()).resolves.toBe(sqlMocks.db);
    expect(sqlMocks.load).toHaveBeenCalledTimes(2);
  });
});
