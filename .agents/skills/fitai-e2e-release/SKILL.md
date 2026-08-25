# FitAI E2E + Release Skill

Use this skill before calling any FitAI build stable, release candidate or production ready.

## Critical interaction contract

The minimum browser path is:

`click → focus → type → persist → submit/commit → lock/reload → unlock → verify`

Run it on mobile and desktop Playwright profiles. For Android, also verify install → launch → runtime permission → native plugin action → background/foreground → process restart → data persistence.

## Required gates

- UNIT PASS: deterministic training/nutrition/data tests.
- STATIC PASS: strict TypeScript and source checks.
- PWA BUILD PASS: static export exists.
- BROWSER E2E PASS: mobile + desktop critical path.
- ANDROID BUILD PASS: APK generated and hashed.
- EMULATOR PASS: install/launch smoke and required native capability smoke where hardware permits.
- BACKUP PASS: export, import, wrong PIN, corruption, unsupported version.
- DEVICE PASS: real Android device with permissions, restart persistence and offline mode.

## Defect policy

P0: data loss, security/privacy breach, app cannot start, corrupt backup/restore.
P1: core workout/nutrition/client flow unusable, persistence failure, permission loop, broken offline behavior.
P2: non-blocking functional/UX defect.
P3: polish/documentation defect.

No `PRODUCTION GO` with unresolved P0/P1. CI infrastructure failure must be reported as infrastructure failure, not application failure or success.
