# FitAI Pro 3 — Multi-agent security, product and engineering audit

Audit date: 2026-08-24 (project local time)

Branch: `feat/fitai-pro-3.0-local-first-pwa`

Status at audit: **NOT PRODUCTION GO**

## Executive conclusion

FitAI Pro 3 has moved from the minimal Java MVP into a substantially healthier local-first architecture: strict TypeScript, static PWA, shared Android/Capacitor product surface, pure fitness-domain functions, encrypted local persistence, deterministic tests, Playwright mobile/desktop E2E and a real Android build pipeline.

The audit found **no confirmed P0 at this point**, but it did find multiple **P1 weaknesses that block a production release candidate**. The highest-risk areas are local data durability/validation, PIN brute-force resistance, incomplete parity of the workout engine, reproducible dependency management, generated Android-shell reproducibility, insufficient test breadth and incomplete physical-device validation.

Several defects were fixed during this audit instead of being left as documentation-only findings:

- GitHub Actions are now pinned to immutable commit SHAs.
- checkout no longer persists Git credentials.
- runtime dependency, React Doctor and AccessLint baseline scans are collected.
- Android `lintDebug` is now a blocking gate.
- emulator APK path handling was corrected after proving that the emulator itself booted successfully.
- Epley e1RM is now constrained to 1–12 repetitions.
- routine split semantics were corrected so a 5-day `Lower` day cannot accidentally use the Push pool.
- regression unit tests were added for both training-engine defects.

The product should continue as an engineering candidate, not yet as a production release.

---

## Methodology and agent routing

This review follows the repository’s `AGENTS.md`, the operational files under `.agents/agents/`, all binding FitAI skills and the reviewed external audit lenses.

### Principal Orchestrator

Scope reviewed:

- architectural consistency
- branch/release policy
- cross-agent conflicts
- evidence quality
- production-status truthfulness

Conclusion: the architecture direction is coherent, but production language must remain gated. The principal risk is not a single catastrophic flaw; it is the gap between the breadth of the intended fitness product and the still-small set of validated vertical flows.

### Architecture & Platform Agent + `fitai-architecture` + PWA/Capacitor skills

Strengths:

- one TypeScript product core for PWA + Android
- static-export architecture matches current local-only requirement
- no fake server/backend dependency
- native functionality isolated behind adapters
- explicit Android package identity

Weaknesses:

- the Android project is regenerated inside CI on every run rather than treated as a reviewed, versioned native shell;
- this makes Android manifest/security customization and reproducibility harder;
- `FitAIApp.tsx` is a very large client component containing most application screens and orchestration;
- future changes have a high regression/blast radius;
- no explicit application/use-case layer yet despite the architecture documentation describing one.

Severity: **P1 architecture/maintainability**.

Recommended remediation:

1. version the Capacitor Android shell once the plugin set stabilizes;
2. split `FitAIApp.tsx` by feature and extract application commands/repository orchestration;
3. keep domain rules outside React components;
4. add explicit adapters/interfaces before introducing any future cloud repository.

### Training Domain Agent + `fitai-training-engine`

Confirmed defects fixed during audit:

1. e1RM used Epley for arbitrarily high repetition counts. This could generate misleading strength records. It now returns no estimate above 12 reps.
2. five-day routine generation used a four-pool modulo cycle while labeling six possible split names; the `Lower` day could wrap to the Push pool. Explicit 2/3/4/5/6-day splits now preserve their labels and muscle intent.

Remaining P1 functional gaps compared with the intended FitAI product behavior:

- bodyweight-specific logging;
- repetitions per side;
- timed exercise mode;
- richer cardio logging;
- supersets as a first-class workout state;
- rest/work timers;
- multiple progression strategies and deload/stall logic;
- custom exercise CRUD;
- workout notes and richer scheduling/rescheduling;
- undo/edit/delete set controls;
- muscle coverage and activity heatmap depth.

Additional data-semantics issue:

The current workout UI marks the **first logged set automatically as `warmup`** and subsequent sets as `working`. A first set may be a real working set, so the set kind must be chosen or derived from the plan rather than the array position.

Severity: **P1 product/data correctness**.

### Nutrition & Activity Agent + `fitai-nutrition-activity`

Strengths:

- barcode format is constrained;
- Open Food Facts request has timeout and HTTP-status handling;
- remote fields are normalized and clipped;
- nutrition values are converted to finite nonnegative numbers;
- core manual nutrition logging remains local.

Weaknesses:

- Open Food Facts flow records a fixed 100 g amount rather than a proper quantity/serving workflow;
- no offline product cache;
- recipe representation is still simplistic;
- automatic step tracking is only meaningful while the app/native measurement listener is active, not a guaranteed all-day background pedometer;
- real-device sensor/permission behavior remains unverified.

Severity: **P1 for product claims around steps; P2 for nutrition depth**.

Release language must not imply continuous step tracking until it is verified on hardware with background/lifecycle behavior.

### Local-First / Data Integrity Agent + `fitai-local-first`

Strengths:

- persistent application state is encrypted before storage;
- import has a file-size cap;
- schema version is explicit;
- top-level collection presence is validated;
- backup decryption authenticates ciphertext through AES-GCM.

Major weakness:

`parseState` currently performs **shallow validation** and then casts the object to `AppState`. Nested malformed values inside workouts, sets, clients, recipes or settings can pass the trust boundary and fail later in rendering/domain operations.

Severity: **P1 trust-boundary/data-integrity**.

Required remediation:

- introduce strict runtime schema validation for every persisted/imported entity;
- cap collection lengths and string sizes;
- reject non-finite/out-of-range numeric values;
- validate dates and IDs;
- add migration tests before any schema change;
- add corrupted, partial and adversarial backup fixtures.

Durability weakness:

UI state is updated before encrypted persistence finishes. Saves are serialized, but a storage failure can leave the screen showing data that was never durably written. Locking can also occur while the queue is still pending.

Severity: **P1 durability**.

Recommended fix: application commands should expose save state (`saving/saved/error`), await critical commits such as workout completion/backup changes, and flush or reject lock/close transitions while a critical write is pending.

### Security & Privacy Agent + `fitai-security-privacy`

Strengths:

- Web Crypto primitives instead of a hand-written cipher;
- PBKDF2-HMAC-SHA-256;
- 250,000 iterations;
- random 16-byte salt per save;
- AES-256-GCM;
- random 12-byte IV per save;
- PIN not persisted;
- imported ciphertext fails authenticated decryption if modified;
- no application API key is needed for Open Food Facts.

P1 weakness: **4-character PIN minimum**.

A four-digit or four-character PIN has too small an offline keyspace if an attacker obtains a backup or device storage. PBKDF2 slows guessing but cannot create entropy that the PIN does not have.

Required before RC:

- raise default secret strength requirements or support a longer passphrase;
- consider Android Keystore/biometric key wrapping for native installs;
- keep a portable PWA-compatible encrypted backup design;
- rate-limit UI attempts for casual/local attacks while acknowledging that copied ciphertext can still be attacked offline.

P1 hardening gap: **Content Security Policy**.

The static PWA/Capacitor WebView does not yet have an explicit CSP strategy. Because Next static output contains framework scripts, the correct policy must be tested rather than added blindly. The policy should restrict remote access to required origins, especially Open Food Facts, and prohibit unsafe embedding/navigation where possible.

No evidence of `dangerouslySetInnerHTML`, `eval` or plaintext state persistence was found in the reviewed application code.

### Product UI Agent + `fitai-product-ui` + Emil Kowalski + Impeccable + Hallmark + Taste

Strengths:

- coherent dark visual foundation;
- shared tokens for surfaces/color/radius;
- mobile and desktop navigation patterns;
- consistent cards/buttons/metrics;
- reduced-motion support;
- loading/empty/success/error concepts exist;
- UI avoids adding a heavy chart framework for simple bar visualization.

Weaknesses:

- the product still looks more like a polished dashboard shell than a mature coaching/workout product in several feature areas;
- the functional density inside `FitAIApp.tsx` makes design refinement risky because product state and visual code are tightly coupled;
- interactions lack a shared motion-token system;
- several action sizes are inconsistent;
- destructive actions rely on native `window.confirm`, visually breaking the product system;
- some microcopy and charts become very small on mobile.

Hallmark/Taste conclusion: do not add decorative gradients, glass effects, animations or oversized hero sections merely to make the app look “premium.” Product distinction should come from excellent workout execution, clear data hierarchy, useful coaching context and intentional motion.

Severity: **P2 visual/design-system**, except where it intersects accessibility.

### Transitions.dev motion audit

Current CSS uses independent timings such as roughly 160 ms, 220 ms and 240 ms with generic `ease` values rather than semantic motion tokens.

Positive: reduced-motion overrides are present.

Recommended P2 remediation:

```text
--motion-fast: 120ms
--motion-standard: 180ms
--motion-emphasis: 240ms
--ease-standard: cubic-bezier(...)
--ease-enter: ...
--ease-exit: ...
```

Only animate properties that do not create expensive layout/repaint work. The workout logger should prioritize immediate feedback over decorative transition choreography.

### Accessibility Agent + `fitai-accessibility` + AccessLint

Strengths:

- global `:focus-visible` exists;
- form labels are generally explicit;
- reduced-motion is respected;
- mobile safe-area bottom padding is considered;
- semantic button/input controls are widely used.

Confirmed/manual weaknesses:

- several controls are below the desired ~44 px touch-target baseline: compact primary ~42 px, secondary ~42 px, ghost ~39 px;
- some mobile labels use extremely small font sizes (~0.57–0.59 rem);
- `.empty-state` muted text (`#737b87` on the primary panel background) is approximately 4.35:1, below the WCAG AA 4.5:1 target for normal-sized text;
- chart-only visual information needs stronger accessible textual equivalence as progress features expand;
- physical Android font-scaling/TalkBack behavior is not yet verified.

Severity: **P1 for release accessibility baseline; individual visual issues mostly P2**.

AccessLint executable output is collected by CI as a baseline artifact and must be triaged rather than blindly auto-fixed.

### React / Next Platform Agent + React Doctor + Vercel React Best Practices

Major architectural finding:

`FitAIApp.tsx` is a monolithic client component containing boot/unlock, save queue, navigation and nearly all feature screens. This creates:

- large render/update blast radius;
- difficult component-level testing;
- harder code splitting;
- stale-closure risks;
- persistence behavior mixed with presentation;
- reduced ownership boundaries between feature agents.

Severity: **P1 maintainability/reliability**.

Specific stale-state risk:

Workout finalization constructs the finished session from closure state and then commits a mutation. It should derive the final operation from the current authoritative state/application command to prevent race/staleness under rapid updates.

React Doctor output is now persisted in CI. Tool scores are advisory; individual findings must be reproduced and mapped to a concrete code location before becoming release blockers.

### Performance Agent + `fitai-performance`

Strengths:

- no unnecessarily large UI/chart library;
- static export is favorable for startup/offline behavior;
- Open Food Facts is invoked on demand;
- no bundled exercise-video library bloats the current shell.

Weaknesses:

- monolithic client component reduces opportunities for feature-level lazy loading;
- all screens and much of the application behavior live in one client bundle path;
- service-worker runtime cache has no explicit entry limit or expiration policy;
- repeated encrypted serialization of the entire AppState on every mutation will scale poorly as sessions, clients and nutrition history grow;
- using a single whole-state encrypted envelope means persistence cost increases with historical data size.

Severity: **P1 scalability for long-lived local data; P2 for current small datasets**.

Before large production histories, introduce a local encrypted repository design that can segment data without requiring a SQL database if the no-database constraint remains.

### PWA audit + `fitai-pwa-capacitor`

Strengths:

- manifest exists;
- standalone display/start URL/theme configuration exists;
- service worker caches same-origin shell/runtime resources;
- core product does not require a server;
- Open Food Facts remains an optional network feature.

Weaknesses:

- only SVG app icon is defined; 192/512 PNG/maskable install assets should be added for broader platform compatibility;
- no install screenshots;
- no automated offline reload/critical-flow test yet;
- cache version exists but no quota/expiration controls;
- no explicit offline indicator/state for optional network features.

Severity: **P2**, except offline regression testing which is **P1 before claiming robust offline PWA**.

### Native Bridge / Android Agent + `fitai-native-bridge` + Capawesome/Capgo

Strengths:

- native capability is isolated behind TypeScript adapters;
- barcode support checks platform/module availability;
- pedometer checks availability and permission;
- sensor listener cleanup exists;
- unsupported paths return readable errors.

Weaknesses:

- camera/barcode and pedometer have not passed physical-device gates;
- generated plugin build reports deprecation/overrides warnings that should be monitored against future Android releases;
- generated Android project is not yet versioned;
- no native instrumentation suite;
- no background-step service guarantee.

Severity: **P1 release/native validation**.

### QA Agent + `fitai-android-qa` + `fitai-e2e-release` + Playwright

Current validated automated path is valuable but narrow:

`first-run → PIN → generate routine → start workout → log series → finish → persist → lock → unlock → verify progress`

It runs on both mobile and desktop Playwright profiles.

Unit coverage is still small relative to product scope. New e1RM/split regression tests have now been added, but mandatory missing tests include:

- encryption round-trip/wrong PIN/corruption;
- strict state/backup validation;
- backup size/schema rejection;
- Open Food Facts timeout/malformed payload;
- native unavailable/permission-denied adapters;
- PWA offline restart;
- nutrition persistence;
- Coach Center persistence;
- invalid/range input;
- timezone/week-boundary calculations;
- workout set edit/delete/undo once implemented;
- migration fixtures.

Severity: **P1 QA breadth**.

### Supply Chain / Release Agent + `fitai-supply-chain` + StarSling `ci-secure`

Improvements completed during audit:

- GitHub Actions pinned to immutable SHAs;
- checkout credentials disabled;
- workflow `permissions` remains `contents: read`;
- no `pull_request_target` or write permission is used;
- `npm audit` baseline is collected;
- Android lint is a blocking build gate.

P1 remaining problem: **no committed `package-lock.json`**.

Without the lockfile, CI uses `npm install` and may resolve a different dependency graph over time. Required remediation:

1. produce and review `package-lock.json`;
2. commit it;
3. switch normal CI to `npm ci`;
4. pin scanner versions instead of `@latest` in release CI;
5. keep experimental/current scanners in a low-privilege audit job;
6. produce dependency/SBOM evidence for RC.

Current transitive/build warnings observed from the Android/Node pipeline include a deprecated `uuid@7.0.3`, an `esbuild` postinstall/allow-scripts warning, generated Capacitor `flatDir` warnings and ML Kit/native-library packaging warnings. These are not automatically vulnerabilities, but they require dependency-owner review.

Severity: **P1 reproducibility/supply-chain before RC; warnings P2 unless a vulnerability is confirmed**.

---

## Severity register

### P0 — critical

**None confirmed in the reviewed code/evidence.**

A P0 would include deterministic data loss, exploitable secret exposure, unrecoverable backup corruption, app startup failure for all users or a confirmed severe security compromise. None has been established by this audit so far.

### P1 — must resolve before production RC

1. shallow nested backup/AppState validation;
2. UI state can report success before durable encrypted save completes;
3. 4-character PIN minimum / weak offline entropy;
4. missing explicit CSP/security policy for static PWA/WebView;
5. workout feature parity gaps: bodyweight/per-side/timed/cardio/supersets/timers/progression/custom exercises/scheduling;
6. first logged set incorrectly auto-labeled warmup;
7. monolithic `FitAIApp.tsx` and stale-state risks;
8. no committed npm lockfile / `npm ci` reproducibility;
9. generated Android shell not yet versioned;
10. no physical-device barcode/pedometer/permission gate;
11. insufficient automated breadth for backup, nutrition, Coach, offline/native/error paths;
12. no offline critical-path PWA E2E;
13. whole-AppState encryption/save model has long-history scalability risk;
14. accessibility baseline still has touch-size/contrast/font-scaling issues to close.

### P2 — important hardening/polish

- semantic motion tokens;
- small mobile labels;
- SVG-only install icon set;
- richer PWA install metadata/screenshots;
- Open Food Facts serving/quantity/cache UX;
- service-worker cache limits/expiration;
- dependency deprecation/build warnings;
- consistent product-native destructive confirmation instead of `window.confirm`;
- stronger chart semantics and richer no-data states.

### P3 — backlog/quality

- ID fallback uses `Math.random` when `crypto.randomUUID` is unavailable; this is not used as an authentication secret, but a deterministic platform fallback would be cleaner;
- documentation/UI microcopy consistency;
- nonessential visual refinements after functional gates are green.

---

## Threat matrix

| Threat | Current control | Residual risk | Priority |
| --- | --- | --- | --- |
| Stolen local/backup data | AES-GCM + PBKDF2 | weak short PIN can be brute-forced offline | P1 |
| Corrupt/malicious import | authenticated encryption + top-level checks | nested object validation too shallow | P1 |
| Data loss on save failure | serialized save queue | optimistic UI may outpace durable write | P1 |
| Web injection | React escaping/no dangerous HTML observed | no explicit CSP yet | P1 |
| CI action compromise | actions now SHA-pinned/read-only | dynamic npm scanners still use `latest` | P1/P2 |
| Dependency drift | versions declared | no lockfile/npm ci | P1 |
| Native permission misuse | just-in-time adapter checks | hardware flows unverified | P1 |
| Incorrect training guidance | pure/tested formulas | incomplete modes and previous split/e1RM regressions | P1; two bugs fixed |
| Accessibility exclusion | focus/reduced motion/semantic controls | contrast/touch/font/device AT gaps | P1/P2 |
| PWA offline regression | shell service worker | no offline E2E/eviction strategy | P1/P2 |
| Long-history performance | no large framework overhead | whole-state encryption/write amplification | P1 scalability |

---

## What the external skills add—and what they do not

### Emil Kowalski

Useful for interaction feedback, purposeful motion and avoiding mechanical UI. It does not decide product architecture or override accessibility.

### Transitions.dev

Useful to standardize duration/easing and audit transition consistency. It does not justify animation where immediate feedback is better.

### React Doctor

Useful as a repeatable React scanner. It should find likely correctness/performance/security/architecture smells, but every high-severity result still needs source verification.

### Vercel React Best Practices

Useful for re-render, waterfall, rendering and bundle analysis. FitAI’s static-export constraints override server-centric recommendations that do not apply.

### Vercel Web Design Guidelines

Useful for web-interface review, with a supply-chain caveat because its rules may be fetched remotely at audit time. Advisory only.

### AccessLint

Useful for executable WCAG baseline checks. Automated accessibility cannot replace keyboard, screen-reader, font-scale and real-device testing.

### StarSling ci-secure

Useful for CI workflow threat analysis. It helped prioritize SHA pinning, low permissions, checkout credential handling and future scanner isolation.

### Impeccable / Hallmark / Taste

Useful for typography, hierarchy, spacing and avoiding generic AI-template aesthetics. They must never become three competing redesign authorities.

### Capawesome / Capgo

Useful for Capacitor plugin setup/review. They do not replace Android documentation, plugin-source review or physical-device QA.

---

## Release gate truth at this audit

Validated in the prior/current pipeline family:

- `UNIT PASS` — yes for the exercised tests; new regression suite is rerunning after training fixes.
- `STATIC PASS` — yes on the preceding app commit; rerunning on latest.
- `PWA BUILD PASS` — yes on preceding app commit; rerunning on latest.
- `BROWSER E2E PASS` — mobile + desktop critical path passed on preceding app commit; rerunning on latest.
- `ANDROID LINT PASS` — new gate has passed on the hardened CI baseline commit.
- `ANDROID BUILD PASS` — debug APK successfully assembled on the hardened CI baseline commit.
- `EMULATOR PASS` — previous failure was proven to be an APK-path bug after the emulator itself booted; corrected gate is rerunning and must finish successfully before this becomes PASS.
- `REACT AUDIT` — scanner is now collected; findings require triage before calling it PASS.
- `ACCESSIBILITY AUDIT` — automated baseline is collected; manual/device issues remain, therefore not final PASS.
- `BACKUP PASS` — **not yet**.
- `DEVICE PASS` — **not yet**.
- `SUPPLY-CHAIN PASS` — **not yet** because there is no committed lockfile and release scanner inputs are not fully pinned.
- `RC` — **no**.
- `PRODUCTION GO` — **no**.

---

## Recommended remediation order

### Phase A — integrity/security blockers

1. strict runtime schemas for the entire encrypted state/import format;
2. stronger local secret/Android Keystore strategy;
3. transactional/awaitable persistence semantics;
4. committed dependency lockfile + `npm ci`;
5. CSP/network policy;
6. version native Android shell.

### Phase B — workout product correctness

1. correct set-kind workflow;
2. bodyweight/per-side/timed/cardio logging;
3. rest/work timers;
4. supersets;
5. progression strategies/deload;
6. custom exercises;
7. scheduling/rescheduling;
8. set edit/delete/undo;
9. full regression fixtures.

### Phase C — QA/accessibility/native

1. backup adversarial tests;
2. nutrition/Coach/offline E2E;
3. native permission-denied/unavailable cases;
4. accessibility fixes + automated/manual retest;
5. physical Android device gate for camera/barcode/steps/lifecycle;
6. upgrade/restart persistence.

### Phase D — release hardening

1. SBOM/dependency review;
2. pinned scanner/tool versions;
3. release signing;
4. artifact checksum/provenance;
5. performance baseline on representative history size;
6. release notes/known limitations;
7. `RC` only after all P0/P1 defects are closed or explicitly reclassified with evidence.

---

## Final assessment

FitAI Pro 3 is **architecturally much stronger than the earlier MVP**, but it is not yet safe to describe as “100% functional” or “production ready.” The correct current target is to close the P1 register, preserve the clean local-first architecture, restore the missing high-value training features without reintroducing monolithic code, and prove the resulting application through PWA, Android emulator and physical-device gates.

The most positive audit result is that the weaknesses are now concrete and testable rather than vague: the project has an explicit senior-agent operating model, binding local skills, reviewed external skills, reproducible scanner evidence and a severity-based remediation path.
