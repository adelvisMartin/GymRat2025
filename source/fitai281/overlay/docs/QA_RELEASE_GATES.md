# QA and release gates

A build is not promoted merely because an APK exists.

Required CI sequence:
1. canonical source ZIP integrity
2. Gradle/JDK/SDK bootstrap
3. `testProDebugUnitTest`
4. `lintProDebug`
5. `assembleProDebug`
6. SHA-256 + package metadata
7. artifact upload
8. emulator install
9. instrumentation launch smoke
10. process remains alive after launcher start

Functional regression checklist: register a new account; reject weak password; logout/login; create routine using checkboxes; start workout; mix completed/incomplete sets; save; ensure history affects next suggestion; create timed/bodyweight routine; add meal; add measurement; add coach client/event; export; import with confirmation; relaunch and verify persistence; verify no UI labels contain QA/local/test branding.

Physical-device-only gate: grant activity permission, start step service, walk, verify increment/day rollover/reopen. This cannot be truthfully claimed from an emulator alone.

## Automated characterization added in 2.8.1 QA hardening

Instrumentation now covers the local-first coach/student data journey end-to-end at the application persistence/domain boundary: registration, onboarding profile, client creation, routine assignment, workout history with kg/reps/RIR, progression suggestion, meal, measurement, logout/login and persistence. Negative instrumentation covers offline operation, denied activity permission, repository recreation, low-storage system signal, corrupt/oversize/future-schema imports and double-submit protection for workout save.
