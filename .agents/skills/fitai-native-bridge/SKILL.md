# FitAI Native Bridge Skill

Use this skill when TypeScript requires camera, sensors, notifications, filesystem, biometrics or another Android-only capability.

## Decision order

1. Can the feature work reliably with a standards-based web API? Use it.
2. Is there an official Capacitor 8 plugin? Prefer it.
3. Is there an actively maintained, licensed Capacitor-8-compatible plugin with clear Android requirements? Review and pin it.
4. Otherwise create a narrow custom Capacitor plugin in Kotlin.

## Native review checklist

- Permission is necessary, documented and requested only at the action that needs it.
- Denied/permanently denied/unsupported cases have user-safe fallbacks.
- No long work happens on the Android main thread.
- No secret is compiled into the APK.
- Plugin input is validated before reaching Android SDK calls.
- Plugin output is treated as untrusted at the TypeScript boundary.
- Lifecycle pause/resume and device rotation do not leak listeners.
- Battery/sensor use stops when no longer needed.
- Dependency and Android SDK versions are recorded in the architecture notes.

## Current approved capabilities

- Barcode: `@capacitor-mlkit/barcode-scanning` 8.x, ML Kit/Google Barcode Scanner path.
- Steps: `@capgo/capacitor-pedometer` 8.x, activity-recognition permission on Android.

Do not silently replace these with abandoned plugins or downgrade Capacitor compatibility.
