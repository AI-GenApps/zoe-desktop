import assert from "node:assert/strict";
import test from "node:test";
import { parseReleaseTag, releaseVersion } from "./version.mjs";

test("parses a release date tag into a Tauri SemVer", () => {
  assert.deepEqual(parseReleaseTag("v2026-08-19"), {
    tag: "v2026-08-19",
    year: 2026,
    month: 8,
    day: 19,
    version: "2026.8.19"
  });
});

test("accepts leap day only in leap years", () => {
  assert.equal(releaseVersion("v2024-02-29"), "2024.2.29");
  assert.throws(() => releaseVersion("v2025-02-29"), /invalid calendar date/);
});

test("rejects malformed tags and impossible dates", () => {
  for (const tag of ["2026-08-19", "v2026-8-19", "v2026-08-00", "v2026-13-01", "v0000-01-01"]) {
    assert.throws(() => releaseVersion(tag));
  }
});
