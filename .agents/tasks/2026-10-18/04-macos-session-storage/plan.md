# Repair native session persistence

**Date:** 2026-10-18
**Task:** 04-macos-session-storage

## Objective
Let the macOS nightly persist the successful Better Auth session securely and
publish a replacement nightly, preserving installed-user storage identifiers.

## Context
User sees the session-save error after successful OTP verification. Live sign-in
requests return HTTP 200. Main is 45b0d5b; capability file lacks Stronghold access,
and keyring enables only Linux secret-service support.

## Approach
Grant only the vault commands used for session save/load/delete. Enable native
keyring backends for supported OS targets and check actual roundtrip behavior.
Preserve app identifier, salt, vault/client/session keys and keyring service.
Use regression coverage at the native configuration/storage boundary; mock-only
JavaScript tests do not establish Tauri command authorization or native persistence.

## Steps
- [x] Verify plugin permissions, first-run vault lifecycle and keyring target selection.
- [x] Repair the narrow native configuration/storage defects and add regression coverage.
- [x] Validate relevant JS/native paths and obtain independent review.
- [ ] Push desktop origin/main and publish a new nightly; retain dated release tag.

## Acceptance criteria
- [x] Session save/read/delete commands are authorized for the main window.
- [x] macOS selects its native Keychain backend if fallback is needed.
- [x] Existing installed-user storage identities are preserved.
- [ ] Focused/full checks and hosted installers pass; installed Mac checks remain explicit.

## Verification evidence
- [Native ACL resolution, platform features and remaining gates](references/native-verification.md)
- [Reproducible actual Tauri ACL resolver harness](references/stronghold-acl-check.rs)

## Local results

Full desktop suite: 67 passed; typecheck, Vite build and Linux native cargo check
passed. Independent review found no blockers. Actual Tauri ACL resolution reproduced
all seven operations denied before the repair and authorized afterward, with an
unrelated window still denied. Native installed-Mac behavior awaits the new nightly.
