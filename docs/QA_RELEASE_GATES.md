# FitAI Pro — QA & Release Gates

This checklist prevents a beta/static-validation build from being mislabeled as stable or production-ready.

## Required evidence per candidate

Record:
- branch + commit SHA
- versionCode + versionName
- application id
- JDK / Android Gradle Plugin / Gradle / SDK versions
- emulator/device models + Android versions
- artifact filenames + SHA-256
- known limitations
- linked defects

## Gate A — source/repository

- [ ] Canonical Android source is present in GitHub.
- [ ] Working tree/branch scope is understood.
- [ ] No unrelated files overwritten.
- [ ] No secrets, keystores, credentials, tokens, or private exports committed.
- [ ] Package/application identity is correct.
- [ ] Version metadata is intentional.
- [ ] Third-party licenses/notices are current.

## Gate B — deterministic checks

- [ ] Unit tests pass.
- [ ] New domain behavior has boundary/failure tests.
- [ ] Import/migration parsers have malformed-input tests.
- [ ] Lint/static analysis runs clean or exceptions are documented.
- [ ] No QA backdoor/debug-only bypass exists in production source sets.

## Gate C — build

- [ ] Debug APK builds with the Gradle wrapper.
- [ ] Release APK/AAB builds when signing configuration is supplied securely.
- [ ] R8/minification path is tested if enabled.
- [ ] No build uses undeclared local-only dependencies.

## Gate D — emulator E2E

- [ ] Fresh install/cold start.
- [ ] Onboarding/profile path.
- [ ] Workout create/select/start/log/finish/history.
- [ ] RIR entry and persistence.
- [ ] Timer behavior and process recreation.
- [ ] Offline workout/history path.
- [ ] Recipe/meal path.
- [ ] Coach Center measurement/note path.
- [ ] Backup/export/import path.
- [ ] Navigation/back behavior.
- [ ] Light/dark + Spanish smoke.

## Gate E — physical device

Mandatory when applicable:

- [ ] step tracking foreground/background/restart
- [ ] camera/barcode
- [ ] microphone
- [ ] image picker/upload
- [ ] notifications
- [ ] foreground service behavior
- [ ] share intent / WhatsApp-compatible sharing
- [ ] denied-permission recovery
- [ ] battery optimization interruption/recovery

## Gate F — upgrade/data integrity

- [ ] Install previous stable/QA build with representative data.
- [ ] Upgrade in place.
- [ ] User profile survives.
- [ ] Workout history survives.
- [ ] Measurements/notes survive.
- [ ] Nutrition/recipe state survives where expected.
- [ ] Step state does not corrupt or duplicate.
- [ ] Migrations execute exactly as intended.
- [ ] Export/backup remains readable.

## Gate G — security/privacy

- [ ] Secret scan.
- [ ] Remote API timeouts/retry bounds.
- [ ] Input validation at import/barcode/AI/file boundaries.
- [ ] No sensitive data in logs.
- [ ] Permission list justified.
- [ ] Network security config reviewed.
- [ ] Provider/auth rules reviewed when enabled.
- [ ] AI output validated and non-essential to core offline logging.

## Gate H — accessibility/UI

- [ ] Touch targets usable.
- [ ] TalkBack/content descriptions on primary flows.
- [ ] Focus order is sensible.
- [ ] Large text does not clip critical controls/numbers.
- [ ] Contrast acceptable in light/dark.
- [ ] Error/loading/empty states exist and are understandable.
- [ ] Reduced-motion-safe behavior.
- [ ] Small-height/landscape workout flow remains usable where supported.

## Gate I — release artifact

- [ ] Release signing identity verified.
- [ ] APK/AAB signature verified.
- [ ] SHA-256 recorded.
- [ ] Install from produced artifact, not only Android Studio deployment.
- [ ] No debug label/endpoints/backdoors.
- [ ] Changelog and QA report updated.
- [ ] Store declarations/screenshots/privacy text updated when publishing.

## Release decision

### `NO-GO`
Any unresolved P0/P1 defect, data-loss risk, security blocker, launch/core-workout failure, or missing mandatory hardware test.

### `RC`
All deterministic/build gates pass and only explicitly documented device/store verification remains.

### `PRODUCTION GO`
All mandatory gates pass, including physical-device and upgrade/data-integrity checks, with no unresolved P0/P1 defect.

A blocked gate must be reported as `BLOCKED`, never silently converted to pass.
