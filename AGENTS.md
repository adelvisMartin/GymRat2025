# AGENTS.md — FitAI Pro Gym

## Mission

Evolve FitAI Pro into a production-grade, mobile-first fitness platform without regressing the working MVP. Preserve the existing Android product identity (`com.adelvis.fitai.pro`), user data compatibility, offline behavior, and previously validated features. Prefer incremental, testable changes over rewrites.

## Current baseline

The last validated product baseline is FitAI Pro 2.6 MVP. Previous QA recorded the following as implemented in the source archive: per-user local/offline repository, workout generation/logging, RIR, recipes/nutrition, Coach Center measurements/notes, step tracking, barcode/Open Food Facts integration, local AI fallback, reusable UI primitives, and predictive-back handling.

Important repository caveat: the GitHub branch `fitai-pro-2.6-build` currently points to the legacy GymRat webpage tree and does **not** contain the validated Android 2.6 source archive. Do not pretend otherwise. Feature work that depends on the Android implementation must first restore the canonical 2.6 source into this branch family and verify its checksum/build inputs.

## Non-negotiable rules

1. **Never work directly on `main`.** Use a feature branch and keep commits small and reviewable.
2. **No fake green status.** A static scan is not an Android build; a build is not a device E2E; an emulator pass is not a physical-device pass. Report each gate separately.
3. **Never expose secrets.** No API keys, service-account material, signing passwords, keystores, Firebase secrets, or tokens in source, logs, screenshots, fixtures, or commits.
4. **Validate all external/user input.** Treat imported CSV/JSON, barcode payloads, deep links, AI output, image metadata, and remote responses as untrusted.
5. **Do not create custom authentication cryptography.** Use established platform/provider mechanisms when authentication is enabled.
6. **Use rate limits/backoff** for remote services and AI endpoints. Avoid retry storms.
7. **Offline-first means real offline-first.** Core workout logging, history, measurements, routines, timers, and local calculations must remain usable without Internet.
8. **No destructive migrations.** Schema/data migrations must be versioned, idempotent where practical, covered by tests, and reversible or backed by an export/backup path.
9. **Business/training logic stays out of UI code.** Progression, PR detection, 1RM, scheduling, unit conversion, nutrition calculations, and import mapping belong in pure/testable domain services.
10. **Accessibility is a release requirement.** Touch targets, contrast, dynamic text, content descriptions, focus order, reduced-motion behavior, and TalkBack must be considered.
11. **Performance is a feature.** Avoid loading large exercise media or AI/network work on the main thread. Measure startup, list rendering, database operations, and background jobs.
12. **No silent scope creep.** Preserve existing functionality before refactoring. Refactor only after behavior is covered by tests.

## openGym integration policy

`arvids-unavailable/openGym` is a mirror of openGym and the supplied snapshot is licensed **AGPL-3.0-or-later**. Treat it as a product/behavior reference unless this project explicitly chooses AGPL-compatible code reuse.

Default policy for FitAI Pro:

- Study features, UX flows, domain concepts, test cases, and public behavior.
- Reimplement desired behavior independently in FitAI Pro's architecture.
- Do **not** copy source code, translated datasets, icons, or bundled assets from openGym into FitAI Pro unless licensing implications are reviewed and recorded.
- Record every adopted idea in `docs/OPEN_GYM_REFERENCE.md` as `inspired/reimplemented`, not as copied code.

## Agent roles

### 1. Orchestrator / Senior Software Engineer
Owns scope, branch hygiene, dependency boundaries, migration plan, build status, and final release evidence. Resolves conflicts between specialist recommendations.

### 2. Android Architecture Agent
Owns Java/Android architecture, repositories, Room/local persistence (if/when used), services/workers, navigation, lifecycle correctness, permissions, background execution, and Gradle configuration.

### 3. Training Engine Agent
Owns routines, weekly scheduling, workout state machine, progression rules, RIR/RPE, 1RM, PRs, timed exercises, supersets, body-weight progression, cardio metrics, plate math, and deterministic tests.

### 4. Health & Nutrition Agent
Owns recipes, meals, nutrition totals, barcode lookup, Open Food Facts mapping, unit normalization, steps/activity, measurements, and privacy-safe handling of health-related data. It must not invent medical claims.

### 5. Product UI / UX Agent
Owns hierarchy, design system, responsive/adaptive layouts, empty/loading/error states, motion, typography, iconography, accessibility, and visual consistency. UI changes must preserve functionality.

### 6. Security & Privacy Agent
Owns threat modeling, secrets, secure storage, input validation, network policy, backup/import safety, logging hygiene, permission minimization, release hardening, and dependency review.

### 7. QA / Release Agent
Owns unit, integration, instrumentation, emulator, physical-device, upgrade, offline, permission, background, battery, accessibility, and release-signing gates. It is the only role allowed to mark a release candidate as `GO`.

### 8. Documentation / Release Notes Agent
Owns changelog, architecture decisions, migration notes, QA evidence, known limitations, third-party acknowledgements, and reproducible build instructions.

## Skill routing

Use repository-local skills under `.agents/skills/` when their domain matches the task:

- `fitai-training-engine` for workout/programming logic.
- `fitai-android-qa` for verification and release gates.
- `fitai-security-privacy` for threat modeling and security review.
- `fitai-product-ui` for visual/interaction work.

External design skills may be installed with `scripts/install-agent-skills.ps1`. They are advisory tools; existing FitAI architecture and this file take precedence. Do not run multiple design skills as competing redesign directives in the same pass. Pick one primary design lens, implement, then use another only as an audit.

## Required workflow for every feature

1. Inspect current implementation and tests before editing.
2. Write acceptance criteria and identify migration/security/accessibility risks.
3. Add or update tests that demonstrate existing and new behavior.
4. Implement the smallest complete vertical slice.
5. Run relevant unit/integration tests.
6. Run static analysis/lint.
7. Build debug/release candidates as applicable.
8. Perform UI/device verification for user-facing behavior.
9. Refactor only after tests are green.
10. Update docs/changelog and report exactly which gates passed, failed, or were unavailable.

## Release gate vocabulary

- `STATIC PASS`: source/static checks only.
- `UNIT PASS`: deterministic unit tests passed.
- `BUILD PASS`: Android build artifact produced successfully.
- `EMULATOR PASS`: instrumented E2E passed on emulator.
- `DEVICE PASS`: required flows passed on a physical device.
- `RC`: signed release candidate produced and verified.
- `PRODUCTION GO`: all mandatory gates in `docs/QA_RELEASE_GATES.md` pass with no unresolved P0/P1 defect.

Never collapse these into a single vague “tested” status.
