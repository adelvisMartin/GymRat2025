# AGENTS.md — FitAI Pro 3

## Mission

Build FitAI Pro as a production-grade, local-first fitness product that ships from one web-native TypeScript product surface to both an installable PWA and an Android application through Capacitor. Preserve the Android identity `com.adelvis.fitai.pro`, preserve all validated fitness behavior, and prefer explicit, testable domain rules over UI shortcuts.

FitAI Pro 3 is **local-only by product decision**. There is no server database and no cloud account dependency in this phase. User data stays encrypted on the device. A future remote repository/API must plug into the same domain contracts without forcing a rewrite.

## Current architecture decision

- Product language: **TypeScript**.
- Web/PWA: **Next.js static export + React**.
- Android runtime: **Capacitor 8**, with native Android plugins where device APIs are required.
- Native Android bridge language when a custom bridge is needed: **Kotlin**.
- Persistence: encrypted local vault; no SQL/Room/Firestore/Supabase database in this phase.
- Remote read-only integrations may be used when the user invokes them, e.g. Open Food Facts.
- Android/PWA share the same UI, domain logic, local contracts and regression suite.

Do not introduce Python, FastAPI, Next.js server routes, Firebase, Supabase, PostgreSQL, Room, SQLite, or any other server/database layer merely to imitate a backend. Until cloud sync is approved, the “backend” of the product is the local domain/repository layer.

## Non-negotiable engineering rules

1. **Never work directly on `main`.** Branch → code → QA evidence → push → PR. The user approves merge.
2. **No fake green status.** Typecheck is not a build; browser E2E is not Android E2E; emulator is not a physical device.
3. **Never expose secrets.** No API keys, signing credentials, service accounts, tokens or passwords in source, logs, screenshots or fixtures.
4. **Validate every trust boundary.** Imported backups, barcode strings, Open Food Facts responses, deep links, browser/native plugin results and future AI output are untrusted.
5. **Do not build custom identity cryptography.** The current PIN is a local vault-unlock secret using Web Crypto primitives, not a server identity system. Future real authentication must use a proven provider/platform mechanism.
6. **Local-first must remain genuinely offline.** Core workouts, history, RIR, PR detection, progression, routines, nutrition logs, recipes, clients, measurements and backups must work without Internet.
7. **No destructive migrations.** Every local schema migration must be versioned, tested and backed by import/export recovery.
8. **Domain logic stays pure.** Progression, 1RM, PR detection, plate math, nutrition totals, scheduling and migration logic must not be embedded in React rendering code.
9. **Accessibility is a release gate.** Keyboard/focus order, labels, touch targets, contrast, reduced motion, screen-reader semantics and zoom/text scaling must be verified.
10. **Performance is a feature.** Keep initial JS small, lazy-load noncritical capabilities, avoid main-thread work, avoid unnecessary media and measure PWA/Android startup.
11. **No cosmetic “production ready”.** Production status requires the release gates below, not a version number.
12. **No silent scope creep.** Cloud sync, messaging, payments and remote CRM stay excluded until explicitly authorized.

## openGym and third-party reference policy

`arvids-unavailable/openGym` is treated as a behavior/product reference because its supplied snapshot is AGPL-3.0-or-later. Study concepts, flows and test cases; independently reimplement behavior. Do not copy source, translated datasets, icons or bundled assets unless licensing is explicitly reviewed and recorded.

Every external skill/plugin must be checked for provenance, maintenance, license and compatibility before adoption. Prefer official Capacitor plugins or actively maintained Capacitor-8-compatible plugins for native capabilities.

## Senior agent council

The high-level council below is mirrored by dedicated operational role files under `.agents/agents/`. For nontrivial work, the Orchestrator must route the task to at least one implementation role and one independent review role.

### 1. Orchestrator / Principal Software Engineer
Owns scope, architecture, branch hygiene, dependency boundaries, release evidence, refactor sequencing and conflict resolution between specialists. Operational file: `.agents/agents/orchestrator.md`.

### 2. Product / Requirements Agent
Translates product goals into acceptance criteria, separates current local-only scope from future cloud scope, prevents accidental feature regressions and keeps user-facing behavior coherent.

### 3. TypeScript / Next.js Platform Agent
Owns strict TypeScript, Next.js static export constraints, React architecture, client-state boundaries, web performance, build reproducibility and future API adapter contracts. Operational file: `.agents/agents/architecture-platform.md`.

### 4. Capacitor / Android Bridge Agent
Owns Capacitor 8, Android packaging, Gradle, permissions, WebView/native boundaries, ML Kit barcode integration, pedometer integration and Kotlin custom plugins when web APIs are insufficient. Operational file: `.agents/agents/architecture-platform.md`.

### 5. Training Engine Agent
Owns routines, workout state machine, load progression, RIR/RPE, 1RM, PR detection, timed sets, supersets, cardio metrics, plate math, deterministic generation and regression tests. Operational file: `.agents/agents/training-domain.md`.

### 6. Nutrition & Activity Agent
Owns recipes, meal totals, barcode lookup, Open Food Facts mapping, units, step tracking and privacy-safe wellness data handling. It must not fabricate medical claims. Operational file: `.agents/agents/nutrition-activity.md`.

### 7. Coach Center / CRM Agent
Owns local client isolation, measurements, notes, coach workflows and future sync-ready entity boundaries without leaking one client’s data into another.

### 8. Local-First / Data Integrity Agent
Owns encrypted vault design, schema versioning, import/export, backup validation, corruption handling, migration strategy, atomic persistence and eventual remote repository compatibility. Operational file: `.agents/agents/security-data.md`.

### 9. Security & Privacy Agent
Owns threat modeling, secure storage, permission minimization, input validation, dependency review, CSP/network policy, logging hygiene, backup safety, supply-chain checks and OWASP-aligned review. Operational file: `.agents/agents/security-data.md`.

### 10. Product UI / UX Agent
Owns hierarchy, responsive behavior, design tokens, empty/loading/error states, touch ergonomics, motion restraint, information density and coherence across PWA and Android. Operational file: `.agents/agents/ux-accessibility.md`.

### 11. Accessibility Agent
Owns WCAG-oriented audits, keyboard paths, screen-reader semantics, focus, reduced motion, contrast, font scaling and meaningful labels. Operational file: `.agents/agents/ux-accessibility.md`.

### 12. Performance Agent
Owns bundle analysis, Web Vitals, startup, rendering cost, service-worker caching, network waterfalls, Android WebView startup and memory/battery regressions. Operational file: `.agents/agents/performance-supply-chain.md`.

### 13. QA / E2E Agent
Owns unit, contract, browser E2E, PWA install/offline checks, Android build, emulator launch, physical-device flows, permissions, upgrade/restore and regression evidence. Only this role may recommend `PRODUCTION GO`. Operational file: `.agents/agents/qa-release.md`.

### 14. Release / Supply Chain Agent
Owns dependency pinning, lockfiles, SBOM/dependency review, signing, reproducible build inputs, artifact hashes, release notes and provenance. Operational file: `.agents/agents/performance-supply-chain.md`.

### 15. Documentation Agent
Owns architecture records, migrations, known limitations, runbooks, QA evidence, third-party acknowledgements and developer onboarding.

## Skill routing

Repository-local skills under `.agents/skills/` are binding execution guides when their domain matches:

- `fitai-training-engine`
- `fitai-android-qa`
- `fitai-security-privacy`
- `fitai-product-ui`
- `fitai-local-first`
- `fitai-pwa-capacitor`
- `fitai-native-bridge`
- `fitai-e2e-release`
- `fitai-architecture`
- `fitai-accessibility`
- `fitai-performance`
- `fitai-nutrition-activity`
- `fitai-supply-chain`

### Mandatory skill combinations

- **Training feature:** `fitai-architecture` → `fitai-training-engine` → `fitai-product-ui` → `fitai-accessibility` → `fitai-android-qa`/`fitai-e2e-release`.
- **Nutrition/activity feature:** `fitai-architecture` → `fitai-nutrition-activity` → `fitai-security-privacy` → `fitai-product-ui` → QA.
- **Persistence/import/migration:** `fitai-local-first` + `fitai-security-privacy` + `fitai-architecture` + `fitai-e2e-release`.
- **Native Android capability:** `fitai-native-bridge` + `fitai-pwa-capacitor` + `fitai-security-privacy` + Android QA.
- **UI redesign:** `fitai-product-ui` + `fitai-accessibility` + `fitai-performance`, followed by browser E2E.
- **Dependency/release change:** `fitai-supply-chain` + `fitai-performance` + `fitai-e2e-release`.

External skills installed through `scripts/install-agent-skills.ps1` are advisory lenses:

- **Emil Kowalski skills**: motion/interaction quality. Prefer restrained micro-feedback; respect reduced-motion.
- **pbakaus/Impeccable**: typography, spacing, contrast and systematic UI critique.
- **Hallmark**: detect generic/AI-looking design patterns and weak visual decisions.
- **Taste Skill**: secondary design-system inspiration/audit, not an excuse for uncontrolled redesign.
- **Capawesome Capacitor skills**: native plugin setup/review for ML Kit and Capacitor integrations.
- **Capgo Capacitor skills**: pedometer/native plugin setup/review.
- **Playwright**: interaction QA. The minimum critical sequence is `click → focus → type → persist → submit/commit → reload/unlock → verify` on mobile and desktop.

Do not run multiple design skills as competing redesign directives in the same pass. Pick one primary implementation lens, then use another as an audit.

## Required workflow for every feature

1. Inspect current code and tests.
2. Write acceptance criteria and identify data/security/accessibility risks.
3. Route work through the matching `.agents/agents/*.md` role(s) and binding skills.
4. Add or update deterministic tests first where practical.
5. Implement the smallest complete vertical slice.
6. Run unit/contract tests.
7. Run strict type/static checks.
8. Build the static PWA.
9. Run Playwright mobile + desktop interaction E2E.
10. Build the Capacitor Android APK.
11. Run Android emulator launch/permission smoke.
12. Refactor only after behavior is green.
13. Update docs and report every gate separately.
14. Before release, perform physical-device QA and backup/restore/upgrade tests.

## Release gate vocabulary

- `STATIC PASS`: static/source checks only.
- `UNIT PASS`: deterministic domain/unit tests passed.
- `PWA BUILD PASS`: Next.js static export produced successfully.
- `BROWSER E2E PASS`: Playwright critical flows passed on mobile and desktop profiles.
- `ANDROID BUILD PASS`: APK produced successfully.
- `EMULATOR PASS`: APK installed, launched and required smoke flows passed on emulator.
- `DEVICE PASS`: required flows passed on at least one real Android device, including permissions and restart persistence.
- `BACKUP PASS`: encrypted export/import and wrong-PIN/corruption cases verified.
- `RC`: signed release candidate produced and verified.
- `PRODUCTION GO`: all mandatory gates pass with no unresolved P0/P1 defect.

Never collapse these into a vague “tested”, “stable” or “production ready” claim.
