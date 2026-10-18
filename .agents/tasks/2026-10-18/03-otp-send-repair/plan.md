# Prevent false OTP-send success

**Date:** 2026-10-18
**Task:** 03-otp-send-repair

## Objective
Use https://zoe.w3dev.app when VITE_API_BASE_URL is absent/blank, and only advance
to code entry after the auth endpoint returns its documented JSON acknowledgement.

## Context
The nightly omitted the API base. An HTTP 200 HTML asset response could pass the
previous status-only check, even though no request reached the intended auth server.
User explicitly requested the fallback and diagnosis/fix of false success.

## Approach
Centralize the base URL for auth, member calls and quit. Require {success:true}
from the Better Auth send endpoint and preserve provider errors. Keep request payloads,
native credential storage and the published v2026-10-18 tag unchanged.

## Steps
- [x] Demonstrate URL/false-ack regressions against the old client.
- [x] Implement the shared fallback and strict send acknowledgement.
- [x] Verify focused/full tests, typecheck, build and browser email-step behavior.
- [ ] Publish desktop main and dispatch a new nightly.

## Acceptance criteria
- [x] Default production URL, blank/whitespace fallback and trimmed override work.
- [x] HTML, malformed/missing/negative JSON acknowledgements cannot claim send success.
- [x] Failed sends stay on email entry; valid acknowledgement alone advances.
- [ ] Exact main revision and installer-build status are reported.

## Validation

- Old client failed 16 of 20 intended regression cases; repaired suite passes.
- Full desktop suite: 67 tests passed; typecheck, Vite build and whitespace checks passed.
- Collaborative browser with fetch stubs: HTTP 200 HTML retained email entry and error;
  JSON acknowledgement advanced to code entry. Both requested the production fallback.
- Native installed-app credential persistence and full signed release remain separate gates.
