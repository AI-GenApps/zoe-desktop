import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseArguments(argv) {
  const options = { createUpdaterArtifacts: false, windowsSignScript: null, macosSigningIdentity: null };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--version") {
      options.version = argv[++index];
    } else if (argument === "--output") {
      options.output = argv[++index];
    } else if (argument === "--create-updater-artifacts") {
      options.createUpdaterArtifacts = true;
    } else if (argument === "--windows-sign-script") {
      options.windowsSignScript = argv[++index];
    } else if (argument === "--macos-signing-identity") {
      options.macosSigningIdentity = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.version || !options.output) {
    throw new Error(
      "Usage: node scripts/release/write-tauri-overlay.mjs --version VERSION --output FILE [--create-updater-artifacts] [--windows-sign-script FILE]"
    );
  }

  if (options.windowsSignScript && !options.createUpdaterArtifacts) {
    throw new Error("Windows signing configuration is only valid for a release build");
  }

  return options;
}

export function createTauriOverlay({
  version,
  createUpdaterArtifacts = false,
  windowsSignScript = null,
  macosSigningIdentity = null
}) {
  const overlay = { version };

  if (createUpdaterArtifacts) {
    overlay.bundle = { createUpdaterArtifacts: true };
  }

  if (windowsSignScript) {
    overlay.bundle = {
      ...(overlay.bundle ?? {}),
      windows: {
        digestAlgorithm: "sha256",
        timestampUrl: "http://timestamp.digicert.com",
        signCommand: {
          cmd: "powershell.exe",
          args: ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", windowsSignScript, "%1"]
        }
      }
    };
  }

  if (macosSigningIdentity) {
    overlay.bundle = {
      ...(overlay.bundle ?? {}),
      macOS: { signingIdentity: macosSigningIdentity }
    };
  }

  return overlay;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const output = path.resolve(options.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, `${JSON.stringify(createTauriOverlay(options), null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
