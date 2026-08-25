# FitAI Pro 3 — Architecture

## Decision summary

FitAI Pro 3 replaces the tiny Java-only MVP runtime with a single TypeScript product surface that can ship as both a static Progressive Web App and an Android app through Capacitor 8.

This phase intentionally has **no server database and no cloud account dependency**. The product core is a local domain/repository layer, not a remote backend. Adding Python/FastAPI or Next.js server APIs right now would create latency, operational cost and a new failure mode without solving a current requirement.

### Runtime stack

- TypeScript, strict mode
- Next.js 16 static export
- React 19
- Capacitor 8 Android runtime
- Web Crypto: PBKDF2-SHA-256 + AES-GCM local vault
- Capacitor Preferences: encrypted envelope persistence on Android
- localStorage: encrypted envelope fallback in the browser/PWA
- ML Kit barcode scanning through a Capacitor-8-compatible plugin
- Android step counter through a Capacitor-8-compatible pedometer plugin
- Open Food Facts as a user-triggered read-only remote lookup
- Vitest domain tests
- Playwright mobile + desktop browser E2E
- GitHub Actions PWA → Android APK → emulator smoke

## Layering

```text
UI / Product shell
  React screens, forms, responsive navigation, states
            ↓
Application actions
  start workout, finish workout, add meal, add client, backup
            ↓
Pure domain
  1RM, RIR progression, PR detection, volume, routines, macros
            ↓
Local repository
  encrypted AppState envelope, version validation, import/export
            ↓
Platform adapters
  Web Crypto / Capacitor Preferences / ML Kit / Pedometer / fetch
```

React must not become the owner of training formulas or persistence formats. Native plugins must not become the owner of product rules.

## Local state model

The vault contains a schema-versioned `AppState` with:

- athlete profile and goal
- offline exercise catalog
- workout templates
- finished and active workout sessions
- set records with load/repetitions/RIR
- personal records
- recipes and meal entries
- coach clients, measurements and notes
- daily step snapshots
- settings

No plaintext PIN is stored. The PIN exists only in process memory while the app is unlocked.

## Encryption model

Each save creates a new random 16-byte salt and 12-byte AES-GCM IV. A 256-bit encryption key is derived from the PIN with PBKDF2-SHA-256 and 250,000 iterations. Only the encrypted envelope is written to persistent storage.

This is local vault protection, not server identity authentication. A later account system must use an established identity provider rather than repurposing the local PIN.

## PWA design

Next.js is configured with `output: 'export'`. The app therefore does not depend on SSR or a server API. The service worker stores same-origin shell/runtime assets and prefers fresh navigation responses while retaining an offline fallback.

Core product data is not cached by the service worker; it lives inside the encrypted vault.

## Android design

Capacitor wraps the exact same static product. Native capability is introduced only at the boundary where Android hardware is required.

Current native adapters:

1. Barcode scanning — ML Kit / Google Barcode Scanner.
2. Step counting — Android activity-recognition + `TYPE_STEP_COUNTER` through the pedometer plugin.

The package identity remains `com.adelvis.fitai.pro`.

## Fitness engine

The initial deterministic engine implements:

- Epley estimated 1RM
- session/set volume
- load recommendation from repetition range + actual RIR + target RIR
- personal-record detection for estimated 1RM, load, reps and per-set volume
- per-side plate calculation
- goal-aware routine generation
- nutrition macro aggregation

These are pure functions with unit tests. Additional progression policies can be added as strategies rather than hidden UI conditionals.

## Deliberate exclusions in local-only phase

The following are not faked or silently simulated:

- cloud synchronization
- remote coach/client messaging
- remote CRM
- payments/subscriptions
- cross-device accounts
- server push notifications
- multi-device conflict resolution

The architecture leaves adapters for these future capabilities, but none should be labeled implemented until an actual remote system exists.

## Future backend

When a remote repository is approved, preferred options are evaluated against actual requirements rather than fashion. The current TypeScript contracts can be served by a Next.js/Kotlin/FastAPI backend later. The mobile/PWA domain layer must not change its formulas merely because a transport is added.

## Performance principles

- no unnecessary UI framework dependency
- no chart library for basic progress bars
- no bundled exercise videos in the initial shell
- static code splitting from Next.js
- user-triggered network lookup only for Open Food Facts
- native plugins loaded for device actions
- reduced-motion support

## Release principle

A successful `next build` is not enough. Production status requires unit, strict typecheck, browser E2E, Android APK build, emulator, backup/restore and physical-device validation.
