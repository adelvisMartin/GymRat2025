# FitAI Pro — Progress Log

## 2026-08-22 — v2.7 integrated Android recovery

### Completed

- Located the writable FitAI/GymRat repository: `adelvisMartin/GymRat2025`.
- Kept application work off `main` on `feat/fitai-pro-2.7-opengym-foundation`.
- Reviewed the supplied openGym snapshot and recorded its AGPL-3.0-or-later licensing boundary; FitAI adopts selected behavior through independent implementation rather than source/asset copying by default.
- Added `AGENTS.md`, FitAI-specific skills, optional external design-skill installer, QA/release gates, roadmap, PR template, and openGym adoption ledger.
- Received two FitAI Pro 2.6 Senior Android source ZIPs and verified they are byte-identical: SHA-256 `2327a25e6fcb440b275d357c53d08e95b9159bda81d1d598180e5e237075c659`.
- Restored that Android source as the implementation base and created integrated source snapshot `FitAI-Pro-2.7-Integrated-Android-Source.zip`.
- Integrated version 2.7.0 training/domain improvements: explicit exercise modes, progression strategies, e1RM/PR calculations, body-weight progression, timed/cardio metrics, supersets metadata, RIR/RPE-compatible effort model, notes, scheduling/rescheduling fields, activity/muscle/cardio insights, routine sharing, plate calculator, and validated JSON restore.
- Updated workout/profile/insights surfaces and added an advanced training logger with work/rest timers.
- Removed the deterministic embedded QA credential/backdoor from application source and instrumentation tests; authentication now uses disposable local accounts/guest mode with the existing credential hashing path.
- Added `TrainingEngineV27Test` and expanded deterministic source tests.
- Local static gates: XML parse PASS; Java syntax/parser PASS; new pure Java training/insights compile and smoke PASS; secret/key-pattern scan PASS.
- Uploaded the integrated source ZIP to `source/FitAI-Pro-2.7-Integrated-Android-Source.zip` in the feature branch.
- Added an Android CI workflow using JDK 17, Gradle 9.1.0, Android API/Build Tools 36, unit tests, lint, APK assembly, instrumentation, emulator launch smoke, artifact upload, and SHA-256 recording.
- Merged CI-only PR #2 to `main` so GitHub can recognize/execute the workflow from the default branch. No FitAI 2.7 application implementation was merged by that infrastructure PR.

### Toolchain rationale

The project uses Android Gradle Plugin 9.0.1. Android's current compatibility documentation lists Gradle 9.1.0, Build Tools 36.0.0 and JDK 17 for AGP 9.0.x, matching the CI gate.

### Current evidence

- `STATIC PASS`: yes.
- `PURE DOMAIN COMPILE/SMOKE PASS`: yes.
- `BUILD PASS`: pending the GitHub Android CI result.
- `EMULATOR PASS`: pending the GitHub Android CI result.
- `DEVICE PASS`: pending physical-phone installation/testing, especially steps, barcode/camera, notifications/background service and sharing.
- `PRODUCTION GO`: no; requires build/emulator/device/upgrade gates.

### Next execution sequence

1. Let the default-branch CI workflow execute for this feature-branch synchronization.
2. Inspect exact Gradle/lint/instrumentation failures if any and patch them in this branch.
3. Download the produced `FitAI-Pro-2.7-QA-APK` artifact and verify its hash.
4. Install the exact artifact on a physical Android phone and run hardware-dependent E2E.
5. Only after all mandatory gates pass, promote from QA/RC to a production-signed build.

### Release status

`INTEGRATED SOURCE READY / ANDROID CI GATE RUNNING OR PENDING` — do not label the APK production-ready until the exact produced artifact passes emulator and physical-device checks.
