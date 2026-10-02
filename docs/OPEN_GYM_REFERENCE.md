# openGym Reference for FitAI Pro

## Source reviewed

Primary reference supplied for this work:

- Mirror: `https://github.com/arvids-unavailable/openGym`
- Reviewed mirror commit: `c42ba6b98e3776af5981f20c05ba392238799670`
- Supplied ZIP: `openGym-main.zip`
- Snapshot frontend package version: `1.2.4`
- License in snapshot: `AGPL-3.0-or-later`

The mirror itself contains an issue from the original author indicating that the canonical repository had moved to `https://gitea.com/DuarteSantos/openGym`. The FitAI work should therefore treat this reviewed snapshot as a dated reference, not assume it is the latest upstream state.

## Architecture observed

The reviewed snapshot contains:

- `frontend/`: React 19 + Vite + React Router + Zustand
- `api/`: small Node API using WebAuthn-related dependency
- `web/nginx.conf`: same-origin web serving/API proxy pattern
- Docker/Compose self-hosting path
- Capacitor Android/iOS project structure for a standalone mobile build
- pure training-logic modules with Vitest tests
- localized UI/instructions
- bundled/reference exercise media integration

FitAI Pro is a native Android/Java product baseline and should **not** be converted to React/Capacitor simply to match openGym. Architecture adoption must be problem-driven, not stack-driven.

## Capabilities worth reimplementing in FitAI

### Training planning
- weekly routine schedule
- one-off workout rescheduling
- starter plans
- equipment-aware exercise filtering
- custom exercises

### Workout execution
- last-session prefill
- rest timer
- work timer for timed exercises
- keep-screen-awake during active workout
- supersets
- weighted/body-weight distinction
- reps-per-side behavior
- cardio time/speed metrics
- workout recovery/resume semantics

### Progression and performance
- linear progression
- double progression
- Greyskull-style concepts if FitAI rules are independently specified
- stall/deload explanations
- body-weight rep progression
- estimated 1RM
- multiple PR types
- effort tracking using RIR/RPE

### Insights
- activity heatmap
- muscle coverage map/summary
- exercise progress charts
- body-weight goal trend

### Portability
- plan sharing separate from personal history
- backup/export/import
- importers from popular training trackers

### Product quality
- clear light/dark theme behavior
- consistent iconography
- translations
- explicit data ownership/offline story
- tests around pure training logic

## What FitAI already contributes beyond openGym

FitAI's prior 2.6 MVP work already includes product areas that should remain first-class rather than being displaced:

- recipes and meal insertion
- nutrition totals/workflows
- Open Food Facts / barcode integration
- step tracking with persistence/fallback
- local AI fallback/provider abstraction direction
- Coach Center records and measurements
- notes and WhatsApp sharing/parser flows

The target product is therefore not “openGym ported to Android”. It is **FitAI Pro with a stronger training engine and better product discipline**.

## License/compliance decision

openGym is AGPL-3.0-or-later. Unless FitAI Pro explicitly chooses to comply with AGPL for combined/derivative code, use a clean-room approach:

1. document the user-visible behavior we want
2. write FitAI-specific acceptance tests/specifications
3. implement from those specifications in FitAI architecture
4. avoid copying implementation text/code/assets/translations
5. retain this document as provenance for product inspiration

If direct source reuse is ever approved, stop and perform a license/compliance review before merging it.

## Feature adoption ledger

Use this table as implementation progresses.

| Capability | FitAI status | Adoption mode | Release target |
| --- | --- | --- | --- |
| RIR logging | Existing in 2.6 baseline | Native FitAI | preserve |
| Weekly schedule | Planned | Independent reimplementation | 2.7 |
| One-off reschedule | Planned | Independent reimplementation | 2.7 |
| Supersets | Planned | Independent reimplementation | 2.7 |
| Timed sets/work timer | Planned | Independent reimplementation | 2.7 |
| Progression strategies | Planned | Independent reimplementation | 2.7 |
| Estimated 1RM | Planned | Independent reimplementation | 2.7 |
| RPE option | Planned | Independent reimplementation | 2.7/2.8 |
| Body-weight progression | Planned | Independent reimplementation | 2.7 |
| Reps per side | Planned | Independent reimplementation | 2.7 |
| Cardio metrics | Planned | Independent reimplementation | 2.7 |
| Activity heatmap | Planned | Independent reimplementation | 2.7/2.8 |
| Muscle coverage | Planned | Independent reimplementation | 2.7/2.8 |
| Plan sharing | Planned | Independent reimplementation | 2.7/2.8 |
| Tracker imports | Planned | Independent reimplementation | 2.8 |
| Passkeys/self-host server | Not adopted by default | Product decision required | later |
| React/Capacitor stack | Not adopted | Keep FitAI native Android baseline | n/a |
