# Publish Zoe Agent branding

**Date:** 2026-10-18
**Task:** 01-zoe-agent-rebrand

## Objective
Apply the Zoe Agent display name and logo throughout the desktop app, push to
AI-GenApps/zoe-desktop origin/main, and tag the delivered commit v2026-10-18.

## Context
User explicitly authorized implementation, direct main delivery, and this tag.
Base is local 4664ab9 including the previously unpushed pnpm 12 upgrade; remote main
is bb7e332. Earlier runtime audit findings remain separate work.

## Approach
Update visible branding, app icons, tray artwork, document metadata and release text.
Preserve installed identity, credential/storage keys, updater trust and repository URLs.
Use the previously generated Zoe Agent mark for the app icon and a small vector tray mark.

## Steps
- [x] Apply branding and generate icons.
- [x] Validate typecheck, tests, release helpers, React diagnostics and native packaging.
- [ ] Review the diff and commit scoped changes.
- [ ] Fast-forward push main and annotated v2026-10-18 tag; verify both remote SHAs.
- [ ] Record hosted workflow results and outstanding signing/native gates.

## Acceptance criteria
- [x] Visible product name and installer source metadata say Zoe Agent.
- [x] Logo and derived native icons are prepared in this repository.
- [x] Existing app identifier and persisted identities remain compatible.
- [ ] Local checks pass and exact main/tag delivery is verified.
- [ ] Build publication is reported separately from source/tag publication.

## Validation
Typecheck, 49 unit tests, 3 release-script tests, web build and icon checks pass.
React Doctor reports 94/100 and no changed-file issues; independent diff review found
no new blockers. Browser login page shows the new mark/title; native-only APIs still
report their pre-existing errors in a plain browser. Linux packaging passed and generated
`Zoe Agent_2026.10.18_amd64.deb`; this verifies packaging, not an installed-native smoke test.
No repository signing secrets are configured; tag delivery and signed installer
publication must be reported separately. An unsigned nightly build will be dispatched.
