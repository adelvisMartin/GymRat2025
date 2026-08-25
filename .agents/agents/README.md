# FitAI Pro 3 — Agent Council

These role files make the responsibilities in the root `AGENTS.md` executable and reviewable. They are development roles for Codex/ChatGPT and contributors; they are not runtime code bundled into the APK/PWA.

## Routing

- `orchestrator.md`: coordinates scope, sequencing and final status.
- `architecture-platform.md`: TypeScript/Next.js/Capacitor/Kotlin boundaries.
- `training-domain.md`: workout engine, progression, PR/RIR/1RM, routines.
- `nutrition-activity.md`: meals, recipes, barcode, Open Food Facts, steps.
- `security-data.md`: encryption, privacy, imports, permissions and data integrity.
- `ux-accessibility.md`: product design, responsive behavior and accessibility.
- `qa-release.md`: unit/E2E/Android/device gates and defect classification.
- `performance-supply-chain.md`: performance budgets, dependencies, licenses and reproducible releases.

## Collaboration protocol

For a nontrivial feature, the Orchestrator selects one primary implementation agent and at least one independent review agent. Security/Data and QA/Release review any change that touches persistence, permissions, imports, networking or release artifacts. UI changes receive UX/Accessibility review. Dependency additions receive Performance/Supply Chain review.

No agent may independently label the product `PRODUCTION GO`; only QA/Release may recommend it after all mandatory evidence exists.
