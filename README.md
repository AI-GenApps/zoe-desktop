# Zoe Desktop

The desktop companion for Zoe, the team assistant. It tracks your status (active, idle, on break), lets you plan and
pick your weekly tasks, and shows today's task report. Built with [Tauri 2](https://tauri.app), React and Vite.

The app talks to a Zoe server (`/api/member/*`) and signs in with a bearer session kept in the OS keychain
(Tauri Stronghold).

## Development

Requirements: Node.js (see `.nvmrc`), pnpm 9, and the [Tauri prerequisites](https://tauri.app/start/prerequisites/)
for your platform (Rust toolchain plus the system WebView libraries).

```bash
pnpm install
cp env.example .env.local   # point VITE_API_BASE_URL at your Zoe server
pnpm tauri dev              # desktop app with hot reload
```

Other commands:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Web UI only, in the browser (port 1420) |
| `pnpm typecheck` | TypeScript check |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm build` | Web bundle |
| `pnpm tauri:build` | Desktop installer for the current platform |

## API types

`src/types/protocol.ts` mirrors the server's API schemas. The server repository checks it against its schemas, so
change both together.

## Releases

Pushing a `vYYYY-MM-DD` tag on `main` runs `.github/workflows/release.yml`: it builds, signs and notarizes the macOS
and Windows installers and publishes them to a GitHub Release. The required secrets are listed in
`scripts/release/setup-signing-checklist.md`. Pull requests get unsigned installers as workflow artifacts.

Nightly builds: `.github/workflows/nightly.yml` runs daily at 02:00 UTC and, when `main` has new commits since the last
nightly, publishes unsigned macOS (universal), Windows and Linux (`.deb`, `.rpm`, `.AppImage`) installers to the
rolling [`nightly` pre-release](https://github.com/AI-GenApps/zoe-desktop/releases/tag/nightly). Run it from the
Actions tab (Nightly → Run workflow) to build one on demand.

## License

[GNU AGPL-3.0](LICENSE)
