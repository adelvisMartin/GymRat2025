# FitAI Architecture Skill

Use this skill before any structural change, dependency introduction, module split, native bridge, persistence change or future backend integration.

## Goal

Keep FitAI Pro 3 fast, local-first, testable and ready for a future remote repository without rewriting product rules.

## Rules

1. Domain logic must be framework-independent TypeScript whenever possible.
2. React owns rendering and user interaction, not formulas or persistence formats.
3. Platform APIs sit behind adapters; Android-specific code stays at the Capacitor/Kotlin boundary.
4. Persistence is accessed through repository contracts, never directly from screens.
5. Future cloud APIs must implement the same repository contracts rather than replacing the domain layer.
6. Avoid circular dependencies and giant shared utility modules.
7. Prefer vertical feature modules with explicit public interfaces.
8. Every architectural change must identify migration, rollback, test and security impact.
9. Do not add a server/database because a local function can be expressed cleanly and securely on-device.
10. Do not optimize by duplicating business rules across PWA and Android.

## Review checklist

- Is the dependency direction UI → application → domain → adapters?
- Can the domain be unit-tested without browser or Android?
- Can a native plugin be replaced without touching training rules?
- Does the change preserve offline operation?
- Is state schema versioning preserved?
- Is the new boundary documented?
- Is there a smaller design that provides the same product value?
