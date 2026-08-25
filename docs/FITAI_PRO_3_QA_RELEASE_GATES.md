# FitAI Pro 3 — QA and release gates

## Automated gates

### 1. UNIT PASS

Required coverage includes:

- estimated 1RM
- RIR/repetition based load progression
- session volume
- plate calculation
- PR detection
- nutrition totals
- local-state parsing/migration tests as migrations are added

### 2. STATIC PASS

`npm run typecheck` must succeed in strict TypeScript mode. No suppressed type errors are accepted in domain/data boundaries.

### 3. PWA BUILD PASS

`npm run build` must generate the static `out/` directory with no server-only Next.js dependency.

### 4. BROWSER E2E PASS

Playwright runs both mobile Chromium and desktop Chromium. Minimum flow:

1. first-run setup
2. focus/type name + PIN
3. create encrypted local profile
4. navigate to training
5. generate routine
6. start workout
7. register a set
8. finish/save workout
9. lock
10. unlock using the same PIN
11. verify persisted progress

Add E2E coverage for nutrition, Coach Center and backup as those flows stabilize.

### 5. ANDROID BUILD PASS

CI generates a fresh Capacitor Android shell from the static PWA, syncs native plugins and builds `app-debug.apk`. Record SHA-256.

### 6. EMULATOR PASS

The debug APK must install, launch using package `com.adelvis.fitai.pro`, remain alive after the initial smoke window and produce a screenshot artifact.

Infrastructure timeouts/KVM failures are reported separately and never converted into a fake product pass.

## Manual/physical-device gates before RC

### Core fitness

- create/regenerate routine
- start, background, foreground and continue workout
- multiple sets per exercise
- RIR boundaries
- finish session
- PR detection
- restart app and verify history

### Native Android

- barcode scanner on real camera
- missing Google Barcode Scanner module path
- product not found path
- deny activity permission
- grant activity permission
- step sensor unavailable path
- background/foreground listener cleanup

### PWA

- install from supported browser
- first-load online, then reload offline
- workout/nutrition/client flows while offline
- service-worker update does not delete encrypted data

### Backup

- export encrypted backup
- import valid backup
- wrong PIN fails closed
- corrupt ciphertext fails closed
- malformed JSON fails closed
- oversized file fails closed
- unsupported schema fails closed

### Accessibility

- keyboard-only browser navigation
- visible focus
- screen-reader labels for forms/actions
- mobile touch targets
- system reduced motion
- 200% zoom / large text review
- contrast audit

### Performance

- PWA initial load and interaction responsiveness
- Android cold start
- no unbounded sensor listeners
- no repeated Open Food Facts request loop
- no unnecessary network request during offline core flows

## Release definitions

`RC` requires automated gates + physical-device core/native/backup checks.

`PRODUCTION GO` additionally requires:

- no P0/P1 defect
- release signing verified
- dependency lockfile/SBOM reviewed
- privacy wording reviewed
- changelog and known limitations current
- upgrade/rollback path documented

Never mark `PRODUCTION GO` from a debug APK alone.
