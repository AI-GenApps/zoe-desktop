# Native session configuration verification

Date: 2026-10-18. Host: Linux. No real user tokens were used or logged.

## Actual Tauri ACL resolution

`stronghold-acl-check.rs` uses the installed Tauri `tauri-utils` ACL resolver,
actual generated plugin permission manifests, both application capabilities,
and the macOS platform target. It checks local main-window authorization for
initialize, load/create client, read/write/remove record and save; every operation
must remain denied for an unrelated window. This exercises permission resolution,
rather than asserting that declarations contain expected strings.

The baseline capability was obtained from desktop commit `45b0d5b`, before this
repair. Results from the same resolver and manifests:

```text
macOS baseline: all 7 credential operations denied for main (regression reproduced); unrelated window denied
macOS fixed: all 7 credential operations authorized for main; unrelated window denied
```

Reproduce from the desktop checkout after building its Rust release artifacts
(`cargo build --locked --release` in `src-tauri`; no app launch is required).
The resolver executable links the crate artifacts already produced by that build,
without adding a dependency or modifying the application's manifests:

```sh
task_refs=.agents/tasks/2026-10-18/04-macos-session-storage/references
tauri_utils_rlib=$(rg --files src-tauri/target/release/deps | rg '/libtauri_utils-[^/]+\.rlib$' | head -n 1)
serde_json_rlib=$(rg --files src-tauri/target/release/deps | rg '/libserde_json-[^/]+\.rlib$' | head -n 1)
rustc --edition=2021 "$task_refs/stronghold-acl-check.rs" \
  --extern "tauri_utils=$tauri_utils_rlib" \
  --extern "serde_json=$serde_json_rlib" \
  -L dependency=src-tauri/target/release/deps -o /tmp/zoe-storage-acl-check
git show 45b0d5b:src-tauri/capabilities/default.json > /tmp/zoe-storage-baseline-capability.json
/tmp/zoe-storage-acl-check src-tauri/gen/schemas/acl-manifests.json \
  /tmp/zoe-storage-baseline-capability.json src-tauri/capabilities/desktop.json baseline
/tmp/zoe-storage-acl-check src-tauri/gen/schemas/acl-manifests.json \
  src-tauri/capabilities/default.json src-tauri/capabilities/desktop.json fixed
```

The exact successful local compilation used
`libtauri_utils-6744eeaafe152f04.rlib` and
`libserde_json-84373b73838b4d3c.rlib`. If a checkout retains artifacts from multiple
Rust toolchains or lockfile revisions, use matching artifacts from its latest
release build, or clear stale artifacts first.

## Keyring platform selection

Read the resolved feature graph, rather than inferring backend selection from
Cargo.toml alone:

```sh
cargo tree --locked --manifest-path src-tauri/Cargo.toml --target aarch64-apple-darwin -e features -i keyring
cargo tree --locked --manifest-path src-tauri/Cargo.toml --target x86_64-pc-windows-gnu -e features -i keyring
cargo tree --locked --manifest-path src-tauri/Cargo.toml --target x86_64-unknown-linux-gnu -e features -i keyring
```

Observed macOS: `apple-native`; Windows: `windows-native`; Linux:
`sync-secret-service`. Keyring 3.6.3 selects its mock backend on macOS if
`apple-native` is absent; enabling only `sync-secret-service` did not select a
native macOS backend. Every custom load/save command creates a new `Entry`, so
the old mock backend could lose a saved value even before an app restart.

The lockfile retains existing package versions. It adds the newly selected
optional keyring dependencies, including security-framework 2.11.1 for the
Apple feature's iOS dependency resolution and the already locked macOS 3.7.0.

## First-run directory and scope checks

The locked `iota_stronghold` 2.1.0 implementation calls `create_dir_all` for the
snapshot parent in `commit_with_keyprovider`, before committing the first vault.
No frontend mkdir or filesystem permission expansion is required.

The locked Stronghold plugin's command permissions have no path scope schema or
command-side scope enforcement. The repair grants exactly the seven operations
used by existing session storage to the local `main` window; it does not add
remote URL access, blanket Stronghold defaults, or OS permissions. The installed
OS plugin's `platform()` reads injected internals without invoking a command.

## Proof limits

`cargo check --locked --offline` passed on the Linux host after the capability
and target-feature changes (dev profile, 2 minutes 58 seconds). It compiled the
application and Tauri build-time permission handling without changing the lockfile.

ACL resolution and Cargo feature selection do not establish a native macOS
storage roundtrip. The installed macOS nightly must still verify fresh login,
secure token save, app restart and session restoration, then logout/removal,
including the real Keychain fallback if that path is used. Corrupt-vault and
fallback-selection behavior remains a separate storage-lifecycle concern.
