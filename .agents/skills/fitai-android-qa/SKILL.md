---
name: fitai-android-qa
description: Verify FitAI Pro Android changes from static checks through unit tests, Gradle builds, emulator/device E2E, upgrade/data integrity, permissions, offline behavior, and release artifact validation.
---

# FitAI Android QA

Use this skill for every bug fix, feature completion, release candidate, APK/AAB build, migration, or claim that a FitAI version is stable.

## Core principle

Evidence must match the claim. Never call a source archive “working” because it parses. Never call an APK “production-ready” because it installs. Never mark a release `GO` until the mandatory gates pass.

## Verification ladder

### Gate 0 — repository integrity
- expected package/application id
- expected version code/name
- clean branch diff understood
- no generated secrets/keystores committed
- canonical source present
- dependency lock/version files consistent

### Gate 1 — static checks
- Java/Kotlin/XML syntax/resources
- Android manifest sanity
- missing resource references
- forbidden debug backdoors
- API-key/secret scan
- dependency vulnerability review where tooling exists

### Gate 2 — unit tests
Prioritize pure domain tests for:
- workout generation
- progression
- 1RM/PR calculations
- nutrition totals/unit conversion
- import parsers
- step persistence helpers
- validation/sanitization
- backup schema migration

### Gate 3 — Android build
Run the project’s canonical Gradle wrapper tasks. At minimum:
- debug assemble
- unit tests
- lint
- release assemble/bundle when release configuration exists

Record exact tasks and versions. Do not substitute system Gradle for the wrapper unless the project explicitly requires it.

### Gate 4 — emulator/instrumentation
Test cold start, navigation, persistence, rotation/process recreation where relevant, predictive back, permissions, offline mode, deep links/import intents, and core workout flow.

### Gate 5 — physical device
Mandatory for features whose behavior is hardware/OS dependent:
- step sensor/fallback
- camera/barcode scanner
- microphone/audio input
- image picker/upload
- notifications
- background/foreground service behavior
- battery optimization interruptions
- share intents
- biometric/auth provider if enabled

### Gate 6 — upgrade/data integrity
Install the previous stable build with representative data, upgrade in place, and verify:
- no data loss
- no duplicate records
- migrations run once
- history remains readable
- backups before/after are semantically equivalent
- rollback/export strategy is documented

### Gate 7 — release candidate
- production application id
- release signing works using secrets outside git
- R8/proguard mapping retained securely where used
- APK/AAB signature verified
- artifact hashes recorded
- no debug endpoints/log verbosity/backdoors
- Play declarations/permissions reviewed

## Required E2E smoke

1. Fresh install → onboarding/profile → home.
2. Generate/select workout → log sets including RIR → timer/resume → finish → history/statistics.
3. Force-close/reopen during a workout and verify recoverable state.
4. Disable network and repeat core logging/history operations.
5. Recipe search → meal insertion → nutrition totals.
6. Barcode flow on a physical device when enabled.
7. Step tracking across background/foreground and restart.
8. Coach Center measurement/note persistence and share flow.
9. Backup/export → destructive test profile change → import/restore.
10. Upgrade from prior stable version with non-empty data.

## Bug severity

- P0: data loss, security breach, crash loop, cannot launch, unusable core workout path.
- P1: major feature broken, corrupt calculation/history, auth/sync failure without safe fallback, severe accessibility blocker.
- P2: partial feature defect with workaround, visual/responsive issue, non-critical integration failure.
- P3: polish/copy/minor inconsistency.

No production `GO` with unresolved P0/P1.

## Reporting format

For each run state:
- environment/device/OS
- commit SHA
- exact command or manual scenario
- PASS / FAIL / BLOCKED
- evidence location
- defect link/id if failed

If a gate cannot run, say `BLOCKED`, not `PASS`.
