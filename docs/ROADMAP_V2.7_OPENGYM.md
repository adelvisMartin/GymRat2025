# FitAI Pro 2.7 — Recovery + openGym-Inspired Roadmap

Status: **planning/foundation branch — not a release candidate**

Branch: `feat/fitai-pro-2.7-opengym-foundation`

## 1. Baseline we are preserving

The previously validated FitAI Pro 2.6 MVP source was a clean-room Android/Java 17 application with feature-separated screens and an offline/local repository. Prior QA evidence recorded, among other items:

- workout generator for 2–6 days
- workout logging with kg / sets / reps / RIR and estimated energy
- recipes search/categories and meal insertion
- Coach Center records, measurements, notes, and WhatsApp sharing
- WhatsApp parser
- step counter fallback/persistence/resume
- local AI fallback
- reusable UI kit
- predictive-back handling
- 33 recipes, 84 exercises, and 14 muscle groups in the validated source snapshot

The 2.6 static validation passed, but the full Android Gradle build, emulator E2E, signed release build, and physical-device E2E were still pending. Therefore 2.6 was an MVP validation baseline, **not a production release**.

The canonical archive previously produced was named `FitAI-Pro-2.6-MVP-Source.zip` with recorded SHA-256:

`117e7db09892a2b1a95d684731ccadbe7fc3fec6f8bf766f53599950c2cf1368`

## 2. Repository recovery is P0

The current GitHub branch named `fitai-pro-2.6-build` does not contain that Android source; it points at the legacy GymRat webpage tree. Before implementing Android feature changes here:

1. Restore `FitAI-Pro-2.6-MVP-Source.zip` into this repository/branch family.
2. Verify the archive checksum when the original archive is available.
3. Confirm package `com.adelvis.fitai.pro` and version metadata.
4. Run a no-feature-change build/test baseline.
5. Tag/document the recovered baseline commit.
6. Only then layer 2.7 feature commits.

Do not recreate missing files from memory and call them the canonical 2.6 source.

## 3. Why openGym is useful

The supplied `arvids-unavailable/openGym` snapshot provides a strong reference for the **training engine and workout UX** that FitAI Pro can learn from. Its snapshot identifies itself as frontend version 1.2.4 and includes a React/Vite/Capacitor app, Node API, Docker/nginx self-host path, tests for training logic, and a broad workout feature set.

FitAI Pro should not become a clone. FitAI already has different strengths: nutrition, recipes, barcode food lookup, AI fallback, Coach Center, measurements, and step tracking. The goal is to combine those strengths with a more mature training engine.

## 4. License boundary

The supplied openGym snapshot is AGPL-3.0-or-later. FitAI Pro will therefore use **clean-room behavioral reimplementation by default**:

- allowed: study concepts, flows, acceptance criteria, behavior, public UX patterns
- default: implement equivalent ideas independently in FitAI architecture
- avoid by default: copying source, translations, icons, datasets, or assets
- any direct code reuse requires an explicit licensing decision and third-party attribution/compliance review

See `docs/OPEN_GYM_REFERENCE.md`.

## 5. 2.7 workstreams

### P0 — Recover, build, and prove the baseline

- [ ] Restore canonical 2.6 Android source.
- [ ] Verify source checksum/identity.
- [ ] Gradle wrapper build succeeds.
- [ ] Unit tests run and pass.
- [ ] Android lint runs.
- [ ] App installs on emulator.
- [ ] Core workout flow E2E passes.
- [ ] Physical-device smoke for steps, camera/barcode, microphone/image paths that are enabled.
- [ ] Upgrade/data-preservation path from the last installable FitAI build is tested.
- [ ] No hard-coded secrets or QA backdoors.

### P0 — Training domain foundation

Before feature expansion, normalize training entities so future features do not become UI hacks:

- [ ] explicit set types/modes
- [ ] immutable/completed workout history semantics
- [ ] deterministic routine/day scheduling model
- [ ] domain service for progression targets
- [ ] PR/1RM service
- [ ] consistent units and rounding rules
- [ ] migration/versioning strategy for stored workout data
- [ ] pure unit tests for each calculation/state transition

### P1 — openGym-inspired training upgrades

#### Weekly routines and one-off rescheduling
- [ ] assign routines to weekdays
- [ ] reschedule a single planned date without editing the recurring template
- [ ] clear rest/skipped states

#### Supersets
- [ ] routine editor grouping
- [ ] workout execution order
- [ ] rest-after-group behavior
- [ ] persistence/resume

#### Timed exercises
- [ ] plank/hold/carry mode
- [ ] work timer separate from rest timer
- [ ] actual duration logged when stopped early
- [ ] optional external load

#### Progression engine
- [ ] manual/none
- [ ] linear progression
- [ ] double progression
- [ ] timed progression
- [ ] stalls/deloads with explicit explanation
- [ ] optional Greyskull-style program after FitAI-specific rules are documented

#### Estimated 1RM + PRs
- [ ] 1RM estimate with source set/date
- [ ] eligibility threshold for high-rep sets
- [ ] 1RM progress history
- [ ] distinguish weight PR / rep PR / estimated 1RM PR / timed PR

#### RIR/RPE
- [x] FitAI baseline already records RIR
- [ ] preserve “unrated” separately from zero
- [ ] optional RPE scale with per-set scale persistence
- [ ] historical display/migration tests

#### Body-weight and unilateral work
- [ ] body-weight mode without fake weight field
- [ ] optional added load
- [ ] rep progression when unloaded
- [ ] reps-per-side metadata and even-target handling where relevant

#### Cardio logging
- [ ] time
- [ ] optional distance
- [ ] optional speed/pace
- [ ] cardio history/stat views

### P1 — Product/data portability

- [ ] JSON backup/restore with schema version and validation
- [ ] routine/plan sharing without personal history
- [ ] printable/shareable routine summary where Android platform support makes sense
- [ ] import architecture for external trackers (FitNotes/Strong/Hevy) implemented independently
- [ ] import dry-run/preview and duplicate handling

### P1 — Workout insights

- [ ] activity heatmap
- [ ] muscle-group volume/coverage view
- [ ] untrained/undertrained muscle summary as descriptive data, not medical advice
- [ ] exercise progress chart
- [ ] body-weight goal chart integrated with existing measurements

### P1 — UX/accessibility modernization

- [ ] documented design tokens
- [ ] consistent loading/empty/error states
- [ ] one-handed workout logger ergonomics
- [ ] large-number/numeric alignment rules
- [ ] light/dark theme audit
- [ ] Spanish copy overflow audit
- [ ] TalkBack/content-description audit
- [ ] dynamic text / large font audit
- [ ] reduced-motion-safe transitions

### P1 — Security/release readiness

- [ ] secrets strategy and scanning
- [ ] input validation for import/barcode/AI/network boundaries
- [ ] rate limits/backoff for remote APIs
- [ ] production network security configuration
- [ ] backup/export privacy review
- [ ] permission minimization
- [ ] release signing outside source control
- [ ] dependency review
- [ ] Play Store privacy/data-safety/permission declarations when Play distribution is targeted

### P2 — Advanced training

- [ ] percentage/training-max programming (e.g. 5/3/1-style concepts implemented independently)
- [ ] plate calculator
- [ ] per-exercise notes
- [ ] more starter routines (upper/lower, full-body, 5×5-style)
- [ ] custom exercises
- [ ] equipment filtering
- [ ] richer workout reminders

### P2 — AI-assisted capabilities

Only after deterministic core functionality is stable:

- [ ] AI-assisted plan explanation/suggestions behind a provider interface
- [ ] local fallback for non-essential suggestions
- [ ] structured-output validation
- [ ] explicit data-minimization rules
- [ ] never require AI/network to log a workout or access history

## 6. Definition of done for 2.7

FitAI Pro 2.7 is not “done” when the UI looks complete. A release candidate requires:

- canonical source in GitHub
- reproducible build
- passing unit + lint gates
- passing emulator E2E
- physical-device verification for hardware-dependent features
- upgrade/data-integrity test
- no unresolved P0/P1 defects
- signed artifact verification
- changelog + known limitations + QA report

Use `docs/QA_RELEASE_GATES.md` for the exact release checklist.
