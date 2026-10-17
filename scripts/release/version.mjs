import { fileURLToPath } from "node:url";
import path from "node:path";

const RELEASE_TAG_PATTERN = /^v(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year) {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year, month) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

export function parseReleaseTag(tag) {
  if (typeof tag !== "string") {
    throw new TypeError("Release tag must be a string");
  }

  const match = RELEASE_TAG_PATTERN.exec(tag);
  if (!match) {
    throw new Error(`Release tag must match vYYYY-MM-DD: ${tag}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
    throw new Error(`Release tag contains an invalid calendar date: ${tag}`);
  }

  return {
    tag,
    year,
    month,
    day,
    version: `${year}.${month}.${day}`
  };
}

export function releaseVersion(tag) {
  return parseReleaseTag(tag).version;
}

function main() {
  const [, , tag] = process.argv;
  if (!tag || process.argv.length !== 3) {
    throw new Error("Usage: node scripts/desktop-release/version.mjs vYYYY-MM-DD");
  }

  process.stdout.write(`${releaseVersion(tag)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
