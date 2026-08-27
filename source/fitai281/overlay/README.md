# FitAI Pro 2.8.1 QA-Hardened Production Candidate

Native Android fitness and coaching application, rebuilt as a complete canonical Android Studio project after the previous 2.7 source transport in CI was proven truncated.

## Product scope

FitAI Pro combines five daily surfaces: Home, Training, Nutrition, Progress and Coach. The current release is deliberately local-first: core workouts, clients, meals and measurements remain usable without a backend or subscription. Explicit JSON export/import is the portability boundary.

### Implemented
- local registration and login without hardcoded accounts
- PBKDF2-HMAC-SHA256 passwords, random salts and constant-time comparison
- per-account application state encrypted at rest with Android Keystore AES-GCM
- 84 exercises across 14 explicit muscle groups
- routine generator with real multi-choice muscle selection
- weighted, bodyweight, timed and cardio logging modes
- set completion checkboxes; incomplete sets remain incomplete in history
- manual, linear, double and time progression policies with human-readable reasons
- repeated-miss deload, bodyweight rep progression and practical load rounding
- RIR logging, e1RM, PR summaries, plate calculator and activity heatmap
- supersets represented as explicit groups
- rest timer, workout persistence and notes
- 33 original FitAI recipes and daily food logging
- weight / measurements tracking
- Coach client records, notes and local agenda
- Android share sheet for plans and summaries
- versioned JSON backup/restore with size/schema validation and destructive confirmation
- optional step counter with runtime permission and sensor fallback
- edge-safe layout padding and consistent touch targets

## Build

Requirements: JDK 17, Android SDK 36, Android Build Tools 36.0.0 and Gradle 9.1.0. The project intentionally contains no production signing key.

```bash
gradle testProDebugUnitTest lintProDebug assembleProDebug
```

Device/emulator gate:

```bash
gradle connectedProDebugAndroidTest
```

## Release identity
- application id: `com.adelvis.fitai.pro`
- debug application id: `com.adelvis.fitai.pro.debug`
- versionCode: `281`
- versionName: `2.8.1`
- visible app label: **FitAI Pro**

## Important release boundary

Passing CI proves compilation, unit tests, lint, APK packaging, installation/instrumentation and launch on the configured emulator. Real step-sensor behavior still requires a physical Android device. Production Play release also requires the owner's production signing key and store declarations.

See `docs/` for architecture, security, QA gates, competitive research, data model, API roadmap and licensing boundaries.
