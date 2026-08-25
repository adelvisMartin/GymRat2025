# FitAI Pro 2.8 → 3.0 migration

## Why this migration exists

FitAI Pro 2.8 proved that the Android source could compile, but the runtime remained too small and too coupled to a minimal Java UI to represent the intended product. FitAI Pro 3 changes the product architecture instead of adding cosmetic weight.

## Migration strategy

The 2.8 source remains historical evidence. FitAI Pro 3 is implemented in `apps/fitai-pro/` and becomes the new active product surface after its release gates are green.

### Functional mapping

| 2.8 capability | 3.0 target |
| --- | --- |
| Local profile | Encrypted schema-versioned local vault |
| Workout logging | Active session + set-level load/reps/RIR + finish flow |
| RIR | First-class set field and progression input |
| 1RM | Pure Epley calculation + PR detection |
| PRs | Automatic PR records on session completion |
| Routines | Goal/frequency-aware deterministic generator |
| Nutrition | Manual meals + recipes + macro totals |
| Barcode | Native ML Kit scanner + Open Food Facts lookup |
| Coach Center | Local clients + measurements |
| Steps | Android pedometer adapter + daily snapshots |
| Backup JSON | Encrypted validated export/import envelope |
| Local lock | PIN-derived encryption key; no persisted PIN |
| UI primitives | Responsive shared PWA/Android design system |
| Android | Capacitor-generated APK using same app code |
| Web | Installable offline PWA |

## Data compatibility

FitAI Pro 2.8 stored data in a different format. FitAI Pro 3 does **not** silently reinterpret legacy data because that could corrupt user history. A dedicated legacy importer must be added only after the exact 2.8 export schema is frozen and covered by fixtures.

Until then:

- existing 2.8 installs remain untouched;
- FitAI Pro 3 uses schema version 3;
- FitAI Pro 3 imports only its own encrypted envelope;
- a future `legacy-v2-import` migration may translate validated 2.x exports into schema 3.

## Branching

Active work: `feat/fitai-pro-3.0-local-first-pwa`.

Do not merge to `main` until the user reviews the PR and all mandatory gates are reported separately.

## Rollback

Because 3.0 is isolated in `apps/fitai-pro/`, rollback is straightforward: do not distribute the new APK/PWA and keep the existing 2.8 artifact/source untouched. No destructive in-place migration runs on 2.8 data.
