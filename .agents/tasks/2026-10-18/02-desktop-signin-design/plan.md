# Align desktop sign-in with the Zoe web app

**Date:** 2026-10-18
**Task:** 02-desktop-signin-design

## Objective
Replace the plain desktop email/code screens with a polished, responsive sign-in
experience using the main web app's design language, then deliver to desktop main.

## Context
User requested visual parity with zoe.w3dev.app after rebrand commit 06c92e2.
The site uses charcoal surfaces, indigo, a subtle grid, Syne 700 and Geist.
Desktop authentication remains email OTP; published date tags are immutable.

## Approach
Share one auth layout between both steps, self-host fonts, scope styling to auth,
and preserve native token storage/API behavior. Respect saved/system theme and
provide a visible theme toggle. Validate actual email/code/error/pending UI behavior
with local browser network stubs; no real OTP or production-auth mutation is required.

## Steps
- [x] Inspect web reference and current desktop auth.
- [x] Build shared layout, style email/code forms and vendor fonts/licenses.
- [x] Verify default desktop window, narrow/short windows, dark/light and focus/form flow.
- [x] Run existing tests, typecheck, build, React Doctor and independent review.
- [ ] Push scoped desktop commit to origin/main; sync local submodule checkout.

## Acceptance criteria
- [x] Both auth steps use web typography, palette and consistent form controls.
- [x] Labels, focus, invalid/expired/network errors, disabled and busy states remain usable.
- [x] No new auth provider or production API/storage change is introduced.
- [x] Fonts are self-hosted/loaded, layout fits 900×650, and narrow layouts do not overflow.
- [ ] Exact delivered SHA and remaining native/hosted checks are reported.

## Validation
- Typecheck, 49 existing unit tests and web build passed; React Doctor scanned all
  five changed React/TS files: 94/100 with no changed-file issues.
- Independent review found no new auth or CSS blockers. Inputs use dedicated border
  tokens exceeding 3:1 non-text contrast; normal text passes AA in both themes.
- Browser checked light/dark, 900×650, 900×500, 390×844 and 320×568. Default window
  fits without scroll; narrow/short windows scroll naturally without horizontal overflow.
- Local-only fetch stubs exercised sending/resend pending, invalid/expired/network
  verification failures, missing token, session-storage failure, success navigation,
  and change-email address retention. No real email or production-auth writes occurred.
- Code entry now remains mounted during resend/network errors; successful send returns
  a boolean to the UI without changing auth requests. Session persistence errors are visible.
- Packaged-native authentication and the pre-existing runtime audit findings remain
  outside this visual change. The published v2026-10-18 tag will not be moved.
