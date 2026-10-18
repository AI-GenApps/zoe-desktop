# Zoe Agent artwork

`zoe-agent-concept.png` is the original generated concept. The clean vector mark used
in the application is `public/brand/zoe-agent.svg` (relative to the repository root).
The indigo ribbon Z and teal terminal represent a calm, capable task assistant.

Generate native app icons with:

```sh
pnpm tauri icon public/brand/zoe-agent.svg
```

The monochrome SVG variants here are the source for normal and break tray assets.
Use Tauri's icon CLI with custom PNG sizes to regenerate their 32px derivatives.

The bundle identifier, vault/keychain names, database filename and local storage keys
retain their previous values for installed-user compatibility. They are technical
identifiers, not the visible product name.
